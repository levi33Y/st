import { ElMessage } from "element-plus";
import { isEmpty } from "lodash";
import { computed, onMounted, reactive, ref, toRaw } from "vue";
import { useRoute } from "vue-router";
import { useNavigation } from "../../hooks/useNavigation";
import { useAppStore } from "../../stores/useAppStore";
import {
  IMemberProps,
  ScheduleMeetingChannelMessageEnum,
  ScheduleMeetingChannelMessageProps,
} from "../schedule-meeting/props";
import { IStateProps } from "./props";

export const useAction = () => {
  const { query } = useRoute();

  const appStore = useAppStore();

  const navigation = useNavigation();

  const state = reactive<Partial<IStateProps>>({
    hostList: [],
  });

  const channelData = ref<ScheduleMeetingChannelMessageProps>({
    type: ScheduleMeetingChannelMessageEnum.ScheduleMeetingSetting,
    content: "",
  });

  const participantInfo = computed(() => {
    let result = appStore.userInfo.userName;

    if (state?.hostList?.length && state.hostList.length > 0) {
      result = `${result}、${state.hostList!.at(0)!.name}等${
        state.hostList!.length + 1
      }人`;
    }

    return result;
  });

  const onOpenScheduleMeetingHost = () => {
    const params = {
      participantList: JSON.stringify(state.participantList),
      hostList: JSON.stringify(state.hostList),
    };

    navigation.navigate("/schedule-meeting-host", params, { parent: true });

    state.isModel = true;
  };

  const onOpenUserPassword = (val: boolean) => {
    state.isPasswordVisible = true;

    if (!val) {
      state.isUserPassword = true;
    }

    return true;
  };

  const onSwitchPassword = (val: boolean) => {
    state.meetingPassword = val
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : "";
  };

  const onCopyMeeting = () => {
    if (!state.isSetPassword) return;

    window.clipboard.writeText(state.meetingPassword ?? "");

    ElMessage({
      offset: 28,
      message: "已複製到粘貼板",
      type: "success",
    });
  };

  const handleUpdateRouteQuery = () => {
    const participants = (
      query?.participantList ? JSON.parse(query.participantList as string) : []
    ) as IMemberProps[];

    const meetingPassword = (
      (query.meetingPassword as string) !== "null" ? query.meetingPassword : ""
    ) as string;

    const hosts = (
      query?.hostList ? JSON.parse(query.hostList as string) : []
    ) as IMemberProps[];

    if (!isEmpty(query?.meetingPassword)) {
      state.meetingPassword = meetingPassword;
      state.isSetPassword = true;
      state.isOpenPassword = true;
      state.isUserPassword = true;
    }

    state.isMuted = query?.isMuted === "open";

    state.isRecorded = query?.isRecorded === "open";

    state.isMetis = query?.isMetis === "open";

    state.hostList = hosts;

    state.participantList = participants;

    state.isWaitingRoomEnabled = query?.isWaitingRoomEnabled === "open";
  };

  const onSubmit = () => {
    const data = toRaw(state);

    channelData.value.content = {
      hostList: data.hostList,
      meetingPassword: data.meetingPassword,
      isMuted: data.isMuted,
      isRecorded: data.isRecorded,
      isMetis: data.isMetis,
      isWaitingRoomEnabled: data.isWaitingRoomEnabled,
    };

    window.windowControl.close();
  };

  const onClose = () => {
    channelData.value.content = {};

    window.windowControl.close();
  };

  onMounted(() => {
    handleUpdateRouteQuery();

    window.channelMessaging.onGiveMessage();

    window.onmessage = (e) => {
      if (e.data === "main-give-message") {
        const [port] = e.ports;

        port.onmessage = (e) => {
          state.hostList = e?.data ?? [];
        };
      }

      state.isModel = false;
    };

    window.winEvents.onClose(async () => {
      window.channelMessaging.onSendMessage(toRaw(channelData.value));
    });
  });

  return {
    state,
    participantInfo,
    onOpenScheduleMeetingHost,
    onOpenUserPassword,
    onSwitchPassword,
    onCopyMeeting,
    onSubmit,
    onClose,
  };
};
