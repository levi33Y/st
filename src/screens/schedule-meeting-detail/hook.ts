import { ElMessage } from "element-plus";
import moment from "moment/moment";
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { MeetingStatus, MeetingStreamMode } from "../../entity/enum";
import { useNavigation } from "../../hooks/useNavigation";
import { getMeetingInfoApi, getUserSession } from "../../services";
import {
  GetMeetingInfoResponse,
  MeetingTimeZoneEnum,
} from "../../services/apis/meeting/types";
import { useAppStore } from "../../stores/useAppStore";

export const useAction = () => {
  const appStore = useAppStore();

  const { query } = useRoute();

  const state = reactive<GetMeetingInfoResponse>({
    isMuted: false,
    isPasswordEnabled: false,
    isRecorded: false,
    repeatType: 0,
    timeZone: MeetingTimeZoneEnum.Asia,
    title: "",
    appointmentType: 0,
    status: 0,
    createdBy: 0,
    id: "",
    startDate: 0,
    endDate: 0,
    meetingMasterUserId: 0,
    meetingNumber: "",
    meetingRecordId: "",
    meetingStreamMode: 0,
    mergedStream: "",
    originAdress: "",
    userSessions: [],
    meetingSubId: "",
    isActiveEa: false,
    isActiveRecord: false,
    participants: [],
    password: "",
    securityCode: "",
    isMetis: false,
    repeatWeekdays: [],
    repeatMonthDays: [],
    isLocked: false,
    isWaitingRoomEnabled: false,
  });

  const totalTime = ref<string>("");

  const createdByName = ref<string>("");

  const navigation = useNavigation();

  const onCopyMeeting = (meetingNumber: string) => {
    window.clipboard.writeText(`#${appStore.appInfo.name}：${meetingNumber}`);
    ElMessage({
      offset: 28,
      message: "已複製到粘貼板",
      type: "success",
    });
  };

  const openInvite = (meetingId: string) => {
    navigation.navigate("/invite", { meetingId });
  };

  const joinMeeting = (meetingNumber: string) => {
    navigation.navigate("/room", {
      autoAudio: true,
      microphone: false,
      enableCamera: false,
      userName: appStore.userName,
      meetingNumber,
      isMuted: true,
      meetingStreamMode: MeetingStreamMode.SFU,
    });
  };

  const openMemberList = () => {
    const json = JSON.stringify(state.participants);
    navigation.navigate(
      "/meeting-member",
      { participants: json },
      { parent: true },
    );
  };

  const getInfo = () => {
    const _calculateDuration = (startDate: number, endDate: number) => {
      const start = moment(startDate * 1000);

      const end = moment(endDate * 1000);

      const duration = moment.duration(end.diff(start));

      const hours = Math.floor(duration.asHours());

      const minutes = duration.minutes();

      return { hours, minutes };
    };

    getMeetingInfoApi({ meetingNumber: query.meetingId as string })
      .then((res) => {
        getUserSession(res.data.createdBy).then(
          (res) => (createdByName.value = res.data.userName),
        );
        const { hours, minutes } = _calculateDuration(
          res.data.startDate,
          res.data.endDate,
        );

        state.createdBy = res.data.createdBy;
        state.endDate = res.data.endDate;
        state.startDate = res.data.startDate;
        state.meetingMasterUserId = res.data.meetingMasterUserId;
        state.meetingNumber = res.data.meetingNumber;
        state.status = res.data.status;
        state.title = res.data.title;
        state.timeZone = res.data.timeZone;
        state.participants = res.data.participants;
        state.id = res.data.id;
        totalTime.value = `${hours === 0 ? "" : `${hours}小時`}${minutes}分鐘`;
      })
      .catch(() => {
        ElMessage.error("Error");
      });
  };

  const getStatusContent = (status: MeetingStatus) => {
    let result = {
      title: "",
      style: {
        color: "#FFFFFF",
      },
    };

    switch (status) {
      case MeetingStatus.Pending:
        result = {
          title: "待開始",
          style: {
            color: "#FF6904",
          },
        };

        break;
      case MeetingStatus.InProgress:
        result = {
          title: "進行中",
          style: {
            color: "#4966FF",
          },
        };

        break;
      case MeetingStatus.Completed:
        result = {
          title: "已結束",
          style: {
            color: "#737489",
          },
        };

        break;
      case MeetingStatus.Cancelled:
        result = {
          title: "已取消",
          style: {
            color: "#737489",
          },
        };

        break;
    }

    return result;
  };

  onMounted(() => {
    getInfo();
  });

  return {
    totalTime,
    onCopyMeeting,
    openInvite,
    joinMeeting,
    openMemberList,
    state,
    getStatusContent,
    createdByName,
  };
};
