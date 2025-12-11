import { StoreEventEnum } from "@/entity/enum";
import { MeetingPermissionEnum } from "@/services/apis/meeting/types";
import { useAppStore } from "@/stores/useAppStore";
import { useMeetingStore } from "@/stores/useMeetingStore";
import { ParticipantStream } from "@/utils/livekit/ParticipantStream";
import { IDataEventProps } from "@components/member-list/props";
import { onMounted, ref, Ref } from "vue";

export const useAction = () => {
  const appStore = useAppStore();

  const meetingStore = useMeetingStore();

  const participantList: Ref<ParticipantStream[]> = ref([]);

  const permissionList = ref<Map<string, MeetingPermissionEnum | null>>(
    new Map(),
  );

  const handleMemberListDataReceived = (params: IDataEventProps) => {
    window.store.dispatch(
      StoreEventEnum.MemberListDataReceived,
      JSON.stringify(params),
    );
  };

  const handleUpdateParticipantList = (stream: ParticipantStream[] = []) => {
    participantList.value = stream as ParticipantStream[];
  };

  const handleUpdatePermissionList = (
    permission: [string, MeetingPermissionEnum][] = [],
  ) => {
    permissionList.value = new Map(permission);
  };

  onMounted(() => {
    window.store.subscribe(async (key, value) => {
      switch (key) {
        case StoreEventEnum.UpdateMeetingParticipants: {
          handleUpdateParticipantList(JSON.parse(value));

          break;
        }
        case StoreEventEnum.UpdateMeetingPermission: {
          handleUpdatePermissionList(JSON.parse(value));

          break;
        }
        default:
          break;
      }
    });
  });

  onMounted(() => {
    handleUpdateParticipantList(meetingStore.streamList as ParticipantStream[]);

    handleUpdatePermissionList(
      meetingStore.permissionList as [string, MeetingPermissionEnum][],
    );
  });

  return {
    appStore,
    participantList,
    permissionList,
    handleMemberListDataReceived,
  };
};
