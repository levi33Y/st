import { armsService } from "@/components/arms/ArmsService";
import config from "@/config";
import { useTrtcKeyStore } from "@/stores/useTrtc";
import { useEventListener, useTimeoutPoll } from "@vueuse/core";
import { UpdateInfo } from "electron-updater";
import { ElLoading, ElMessage } from "element-plus";
import { LoadingInstance } from "element-plus/es/components/loading/src/loading";
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { MeetingStreamMode } from "../../entity/enum";
import { MeetingQuery } from "../../entity/types";
import { StoreEventEnum, useNavigation } from "../../hooks/useNavigation";
import { createMeetingApi, GetUserInfoApi } from "../../services";
import { GetRecordCount } from "../../services/apis/home";
import { useAppStore } from "../../stores/useAppStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { existsWindow } from "../../utils/utils";
import MeetingMinutes from "./components/meeting-minutes/index.vue";

const roomPage = "/trtc-room";

export const useAction = () => {
  const appStore = useAppStore();

  const settingsStore = useSettingsStore();

  const trtcKeyStore = useTrtcKeyStore();

  const navigation = useNavigation();

  const getKeyError = ref<boolean>(true);

  const state = reactive<{
    recordBadge: number;
  }>({
    recordBadge: 0,
  });

  const loadingService = ref<LoadingInstance | null>(null);

  const meetingMinutesRef = ref<InstanceType<typeof MeetingMinutes>>();

  const getUserInfo = async () => {
    const { code, data, msg } = await GetUserInfoApi();
    if (code === 200) {
      appStore.updateUserInfo(data);
    } else {
      ElMessage({
        offset: 50,
        message: msg,
        type: "error",
      });
    }
  };

  const onJoinMeeting = () => navigation.navigate("/join-meeting");

  const onQuickMeeting = async () => {
    const isHas = await existsWindow("/meeting");
    if (isHas) return;

    loadingService.value = ElLoading.service({ fullscreen: true });
    try {
      const { code, data, msg } = await createMeetingApi({
        meetingStreamMode: settingsStore.enableMCU
          ? MeetingStreamMode.MCU
          : MeetingStreamMode.SFU,
        startDate: new Date(),
        endDate: new Date(+new Date() + 1000 * 60 * 60 * 24),
        participants: [],
        isMetis: false,
      });
      if (code === 200) {
        navigation.navigate("/meeting", {
          autoAudio: true,
          isMuted: !settingsStore.enableMicrophone,
          enableCamera: settingsStore.enableCamera,
          meetingNumber: data?.meetingNumber,
          userName: appStore.userName,
          meetingStreamMode: MeetingStreamMode.SFU,
        } as MeetingQuery);
      } else {
        ElMessage({
          offset: 50,
          message: msg,
          type: "error",
        });
      }
    } catch {}
  };

  const onJoinLiveKitMeeting = () => navigation.navigate("/join-meeting");
  const onScheduleLiveKitMeeting = () =>
    navigation.navigate("/schedule-meeting");

  const onHistoryLiveKitMeeting = () => navigation.navigate("/history-meeting");
  const onLiveKitMeeting = async () => {
    const isHas = await existsWindow(roomPage);
    if (isHas) return;

    loadingService.value = ElLoading.service({ fullscreen: true });
    const localTimeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const { code, data, msg } = await createMeetingApi({
        meetingStreamMode: settingsStore.enableMCU
          ? MeetingStreamMode.MCU
          : MeetingStreamMode.SFU,
        startDate: new Date(),
        endDate: new Date(+new Date() + 1000 * 60 * 60 * 24),
        isLiveKit: true,
        timeZone: localTimeZoneId,
        participants: [],
        isMetis: false,
      });
      if (code === 200) {
        navigation.navigate(roomPage, {
          // navigation.navigate("/rtrc", {
          autoAudio: true,
          isMuted: !settingsStore.enableMicrophone,
          enableCamera: settingsStore.enableCamera,
          meetingNumber: data?.meetingNumber,
          userName: appStore.userName,
          meetingStreamMode: MeetingStreamMode.SFU,
        } as MeetingQuery);
      } else {
        loadingService.value?.close();

        ElMessage({
          message: msg,
          type: "error",
        });
      }
    } catch {
      loadingService.value?.close();

      ElMessage({
        message: "入會失敗",
        type: "error",
      });
    }
  };

  const onBackMeeting = () => existsWindow(roomPage);

  const gotoSettings = () => navigation.navigate("/settings");

  const onLogout = () => {
    if (appStore.isMeeting) {
      ElMessage({
        offset: 50,
        message: "會議中暫不支持退出登錄",
        type: "warning",
      });
    } else {
      window.meetingNotice.stopSubNotice();

      appStore.logout();

      settingsStore.init();

      window.electronAPI.logout();
    }
  };

  const onRecordList = () => navigation.navigate("/intelligent-list");

  const { pause: onPauseGetRecordCount, resume: onGetRecordCount } =
    useTimeoutPoll(
      () => {
        GetRecordCount()
          .then((res) => {
            state.recordBadge = res.data ?? 0;
          })
          .catch((err) => {
            ElMessage.error("Error" + err.message);
          });

        meetingMinutesRef.value?.meetingMinutesList();
      },
      5000,
      { immediateCallback: true },
    );

  onMounted(() => {
    getUserInfo();

    window.winEvents.onFocus(() => {
      onGetRecordCount();
    });

    window.winEvents.onBlur(() => {
      onPauseGetRecordCount();
    });

    meetingMinutesRef.value?.meetingMinutesList();

    navigation.closeToHide();
  });

  onUnmounted(() => {
    onPauseGetRecordCount();
  });

  useEventListener(window, "focus", async () => {
    const isHas = await existsWindow(roomPage, false);
    appStore.isMeeting !== isHas && (appStore.isMeeting = isHas);
  });

  useEventListener(window, "focus", async () => {
    if (appStore.isMeeting) {
      console.log("會中不会检查更新");

      return;
    }

    await window.autoUpdater.checkForUpdate("/home");
  });

  onMounted(() => {
    window.ipcRenderer.on("update-available", (_, releaseInfo: UpdateInfo) => {
      console.log(releaseInfo);

      const releaseInfoJson = JSON.stringify(releaseInfo);

      window.meetingNotice.stopSubNotice();

      navigation.navigate("/version-update", { releaseInfoJson });
    });

    window.ipcRenderer.on("update-not-available", () => {
      console.log("當前版本為最新版本");

      window.meetingNotice.subNotice(config.baseURL, appStore.access_token);
    });

    window.ipcRenderer.on("update-error", (_, errorMessage: string) => {
      console.log("errorMessage", errorMessage);

      armsService.addApi(
        JSON.stringify({
          code: "UPDATE ERROR",
          msg: errorMessage,
        }),
        false,
      );

      ElMessage.error(errorMessage);
    });
  });

  onMounted(() => {
    navigation.on(StoreEventEnum.RoomPageReady, () => {
      loadingService.value?.close();
    });
  });

  return {
    appStore,
    state,
    meetingMinutesRef,
    getKeyError,
    onJoinMeeting,
    onQuickMeeting,
    onJoinLiveKitMeeting,
    onScheduleLiveKitMeeting,
    onHistoryLiveKitMeeting,
    onLiveKitMeeting,
    onBackMeeting,
    gotoSettings,
    onLogout,
    onRecordList,
    navigation,
  };
};
