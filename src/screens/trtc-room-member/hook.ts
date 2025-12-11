import { MeetingAppointmentType, MeetingRepeatType } from "@/entity/enum";
import { StoreEventEnum, useNavigation } from "@/hooks/useNavigation";
import { IDataEventProps } from "@/screens/trtc-room/components/member-list/props";
import { getAllUserInfo } from "@/services";
import {
  IMeetingUserSessionsProps,
  INoJoinMeetingUsersProps,
  IWaitingRoomUserSessionsProps,
} from "@/services/apis/meeting/types";
import { useAppStore } from "@/stores/useAppStore";
import { IMeetingInfoProps, IUserInfoProps } from "@/utils/trtc/store/room";
import { useDebounceFn, useTimeoutPoll } from "@vueuse/core";
import { onMounted, reactive, ref, Ref } from "vue";
import { useRoute } from "vue-router";

export const useAction = () => {
  const appStore = useAppStore();

  const navigation = useNavigation();

  const { query } = useRoute();

  const meetingInfo = reactive<IMeetingInfoProps>({
    meetingNumber: query?.meetingNumber as string,
    meetingId: query?.meetingId as string,
    meetingSubId: query?.meetingSubId as string,
    meetingTitle: query?.meetingTitle as string,
    repeatType: query?.repeatType as unknown as MeetingRepeatType,
    appointmentType:
      query?.appointmentType as unknown as MeetingAppointmentType,
    creatorId: query?.creatorId as string,
    creatorName: query?.creatorName as string,
  });

  const participantList: Ref<IUserInfoProps[]> = ref([]);

  const meetingUserSessions = ref<IMeetingUserSessionsProps[]>([]);

  const noJoinMeetingUsers = ref<INoJoinMeetingUsersProps[]>([]);

  const waitingRoomUserSessions = ref<IWaitingRoomUserSessionsProps[]>([]);

  const handleMemberListDataReceived = (params: IDataEventProps) => {
    navigation.emit(StoreEventEnum.MemberListDataReceived, params);
  };

  const updateMeetingPermissions = useDebounceFn(async () => {
    const allApiQuery = {
      meetingId: meetingInfo.meetingId,
    } as {
      meetingId: string;
      meetingSubId?: string;
    };

    if (meetingInfo?.meetingSubId) {
      allApiQuery.meetingSubId = meetingInfo.meetingSubId;
    }

    const { code, msg, data } = await getAllUserInfo(allApiQuery);

    if (code !== 200 || data.meetingUserSessions?.length < 0) {
      throw Error(msg);
    }

    meetingUserSessions.value = data?.meetingUserSessions ?? [];

    noJoinMeetingUsers.value = data?.noJoinMeetingUsers ?? [];

    waitingRoomUserSessions.value = data?.waitingRoomUserSessions ?? [];
  }, 300);

  const {
    pause: pauseUpdateMeetingPermissions,
    resume: resumeUpdateMeetingPermissions,
  } = useTimeoutPoll(updateMeetingPermissions, 3000);

  onMounted(() => {
    updateMeetingPermissions();

    navigation
      .on(StoreEventEnum.UpdateMeetingPermission, (value) => {
        updateMeetingPermissions();
      })
      .on(StoreEventEnum.RoomMemberUpdate, (value) => {
        participantList.value = value;
      });

    resumeUpdateMeetingPermissions();
  });

  return {
    appStore,
    meetingInfo,
    participantList,
    meetingUserSessions,
    noJoinMeetingUsers,
    waitingRoomUserSessions,
    handleMemberListDataReceived,
  };
};
