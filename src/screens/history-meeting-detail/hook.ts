import { IHistoryAttendeesProps, MeetingHistoryListData } from "@/entity/types";
import { ElMessage } from "element-plus";
import moment from "moment/moment";
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { MeetingStatus, MeetingStreamMode } from "../../entity/enum";
import { useNavigation } from "../../hooks/useNavigation";
import { MeetingTimeZoneEnum } from "../../services/apis/meeting/types";
import { useAppStore } from "../../stores/useAppStore";

export const useAction = () => {
  const appStore = useAppStore();

  const { query } = useRoute();

  const state = reactive<
    MeetingHistoryListData & {
      status: MeetingStatus;
      createdByName: string;
    }
  >({
    id: "",
    meetingId: "",
    meetingSubId: "",
    userId: 0,
    meetingNumber: "",
    title: "",
    startDate: 0,
    endDate: 0,
    duration: 0,
    timeZone: MeetingTimeZoneEnum.Asia,
    meetingCreator: "",
    attendees: [],
    attendeesCount: 0,
    appointmentType: 0,
    status: MeetingStatus.Pending,
    createdByName: "",
  });

  const totalTime = ref<string>("");

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

  const joinMeeting = () => {
    navigation.navigate("/trtc-room", {
      autoAudio: true,
      microphone: false,
      enableCamera: false,
      userName: appStore.userName,
      meetingNumber: state.meetingNumber,
      isMuted: true,
      meetingStreamMode: MeetingStreamMode.SFU,
    });
  };

  const openMemberList = () => {
    const json = JSON.stringify(state.attendees);

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

    const meetingInfo = query as unknown as MeetingHistoryListData;

    const attendees = JSON.parse(meetingInfo.attendees as unknown as string);

    const { hours, minutes } = _calculateDuration(
      meetingInfo.startDate,
      meetingInfo.endDate,
    );

    state.createdByName = attendees.find(
      (item: IHistoryAttendeesProps) => item.id == meetingInfo.userId,
    )?.userName;

    // state.createdBy = meetingInfo.createdBy;
    state.endDate = meetingInfo.endDate;
    state.startDate = meetingInfo.startDate;
    state.meetingNumber = meetingInfo.meetingNumber;
    state.status = MeetingStatus.Completed;
    state.title = meetingInfo.title;
    state.timeZone = meetingInfo.timeZone;
    state.attendees = attendees;
    state.id = meetingInfo.id;
    totalTime.value = `${hours === 0 ? "" : `${hours}小時`}${minutes}分鐘`;
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

  const viewRecord = () => {
    navigation.navigate("/intelligent-list");
  };

  onMounted(() => {
    getInfo();
  });

  return {
    state,
    totalTime,
    onCopyMeeting,
    openInvite,
    joinMeeting,
    openMemberList,
    getStatusContent,
    viewRecord,
  };
};
