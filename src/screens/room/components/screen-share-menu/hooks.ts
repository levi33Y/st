import { WindowsLevelEnum } from "@/entity/enum";
import { waitAnimationFrame } from "@/screens/room/utils";
import { useMeetingStore } from "@/stores/useMeetingStore";
import { useDebounceFn, useTimeoutPoll, useToggle } from "@vueuse/core";
import { ModelRef, ref, watch } from "vue";
import Size = Electron.Size;
import Display = Electron.Display;

export const useAction = (visibleModel: ModelRef<boolean>) => {
  const meetingStore = useMeetingStore();

  const TipSize: Size = {
    width: 225,
    height: 70,
  };

  const MenuSize: Size = {
    width: 996,
    height: 145,
  };

  const windowPath = "/room";

  const tipRef = ref<HTMLDivElement>();

  const menuRef = ref<HTMLDivElement>();

  const roomLastSize = ref({
    x: 0,
    y: 0,
    width: 960,
    height: 640,
    minWidth: 960,
    minHeight: 640,
  });

  const [loading, loadingToggle] = useToggle(false);

  const [showDetail, showDetailToggle] = useToggle(false);

  const handleSetWindowSize = async (
    size: [number, number],
    position: [number, number],
  ) => {
    await window.windowControl.setSize(windowPath, size);

    await window.windowControl.show(windowPath, position);
  };

  const handleSetWindowStyle = async (sharing: boolean) => {
    await window.windowControl.setWindowsButton(windowPath, !sharing);

    await window.windowControl.setLevel(
      windowPath,
      sharing && WindowsLevelEnum.ScreenSaver,
    );

    await window.windowControl.setResizable(windowPath, !sharing);
  };

  const handleStartShare = async () => {
    const windowSize = await window.electronAPI
      .getCurrentWindow()
      .onGetWindowSize(windowPath);

    roomLastSize.value = {
      ...roomLastSize.value,
      ...windowSize,
    };

    const screenSize = meetingStore.captureSourcesWindow;

    await handleSetWindowSize(
      [TipSize.width, TipSize.height],
      [screenSize.width / 2 - TipSize.width / 2 + screenSize.x, 0],
    );

    await handleSetWindowStyle(true);
  };

  const handleEndShare = async () => {
    await handleSetWindowSize(
      [roomLastSize.value.width, roomLastSize.value.height],
      [roomLastSize.value.x, roomLastSize.value.y],
    );

    await handleSetWindowStyle(false);
  };

  const { isActive, pause, resume } = useTimeoutPoll(
    async () => {
      const { x, y } = await window.screenAPi.cursorPoint();

      const {
        width,
        height,
        x: windowX,
        y: windowY,
      } = await window.electronAPI
        .getCurrentWindow()
        .onGetWindowSize(windowPath);

      const areaX = width + windowX;

      const areaY = height + windowY;

      const isArea = x > areaX || x < windowX || y > areaY || y < windowY;

      isArea && !loading.value && handleSwitchModel();
    },
    300,
    {
      immediate: false,
      immediateCallback: true,
    },
  );

  const handleSwitchModel = useDebounceFn(async () => {
    if (!visibleModel.value || loading.value) {
      return;
    }

    loadingToggle(true);

    try {
      isActive && pause();

      showDetailToggle();

      const windowSize = await window.electronAPI
        .getCurrentWindow()
        .onGetWindowSize(windowPath);

      const x = windowSize.x + windowSize.width / 2;

      const size = showDetail.value ? MenuSize : TipSize;

      await handleSetWindowSize(
        [size.width, size.height],
        [x - size.width / 2, windowSize.y],
      );

      showDetail.value && resume();
    } finally {
      loadingToggle(false);
    }
  }, 100);

  const handleMouseEnter = async () => {
    if (loading.value) return;

    await handleSwitchModel();

    await window.windowControl.focus("/room");
  };

  watch(visibleModel, async (val) => {
    if (val) {
      loadingToggle(true);

      await handleStartShare();

      waitAnimationFrame().then(() => {
        showDetailToggle(false);

        tipRef.value?.addEventListener("mouseenter", handleMouseEnter);
      });

      loadingToggle(false);
    } else {
      tipRef.value?.removeEventListener("mouseenter", handleMouseEnter);

      pause();

      await handleEndShare();
    }
  });

  return {
    tipRef,
    menuRef,
    handleEndShare,
    showDetail,
    loading,
    pause,
    resume,
  };
};
