import { DataChannelCommand, WindowsLevelEnum } from "@/entity/enum";
import { OnlineTypeEnum } from "@/entity/response";
import { StoreEventEnum, useNavigation } from "@/hooks/useNavigation";
import { MeetingDropdownType } from "@/screens/sharing-dropdown-menu/props";
import { waitAnimationFrame } from "@/screens/trtc-room/utils";
import { updateMeetingLock } from "@/services";
import { RoomEventEnum, roomService } from "@/utils/trtc/roomService";
import { handlerPathParams } from "@/utils/utils";
import { useDebounceFn, useTimeoutPoll, useToggle } from "@vueuse/core";
import { TRTCScreenCaptureSourceInfo } from "trtc-electron-sdk";
import { computed, ModelRef, onMounted, ref, toRaw, watch } from "vue";
import Size = Electron.Size;

const windowPath = "/trtc-room";

export const useAction = (visibleModel: ModelRef<boolean>) => {
  const navigation = useNavigation();

  const TipSize: Size = {
    width: 225,
    height: 70,
  };

  const MenuSize: Size = {
    width: 996,
    height: 145,
  };

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

  const dropdownWindow = ref<any>();

  const meeting = computed(() => roomService.roomStore.meeting);

  const isHost = computed(() => roomService.roomStore.isHasHost);

  const recordingState = computed(() => roomService.roomStore.recordState);

  const memberSize = computed(() => {
    return roomService.roomStore.userList.filter((item) =>
      [OnlineTypeEnum.Online, OnlineTypeEnum.Waiting].includes(item.status),
    ).length;
  });

  const captureSources = computed(() => roomService.roomStore?.captureSources);

  const [loading, loadingToggle] = useToggle(false);

  const [showDetail, showDetailToggle] = useToggle(false);

  const [dropdownMenuLoading, dropdownMenuLoadingToggle] = useToggle(false);

  const handleSetWindowSize = async (
    size: [number, number],
    position: [number, number],
  ) => {
    await window.windowControl.setSize(windowPath, {
      width: size.at(0),
      height: size.at(1),
    });

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
    try {
      const windowSize = await window.electronAPI
        .getCurrentWindow()
        .onGetWindowSize(windowPath);

      roomLastSize.value = {
        ...roomLastSize.value,
        ...windowSize,
      };

      const info = captureSources.value as TRTCScreenCaptureSourceInfo & {
        x: number;
        y: number;
      };

      await handleSetWindowSize(
        [TipSize.width, TipSize.height],
        [info.width / 2 - TipSize.width / 2 + info.x, 0],
      );

      await handleSetWindowStyle(true);
    } catch (err) {
      console.error(err);
    }
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

  const onOpenMenu = useDebounceFn(async (type: MeetingDropdownType) => {
    const { x } = await window.screenAPi.cursorPoint();

    const { y, height } = await window.electronAPI
      .getCurrentWindow()
      .onGetWindowSize(windowPath);

    pause();

    window.windowControl
      .show("/sharing-dropdown-menu", [x - 70, y + height])
      .then(() => {
        // sending must be done after the window is displayed
        navigation.emit(StoreEventEnum.OpenRoomDropdownMenu, type);
      });
  }, 300);

  const onOpenMemberList = () => {
    navigation.navigate("/trtc-room-member", {
      ...roomService.roomStore.meeting,
    });
  };

  const onStopShare = () => {
    const paths: string[] = [
      "/trtc-screen-canvas",
      "/trtc-screen-dialog",
      "/trtc-room-member",
      "/meeting-invitation-confirm",
    ];

    paths.forEach((path) => {
      navigation.destroy(path);
    });

    roomService.mediaManager.setScreenShareEnabled({
      enabled: false,
    });
  };

  const createDropdownWindow = () => {
    if (!dropdownWindow.value) {
      dropdownWindow.value?.close();
    }

    const query = {
      meetingId: roomService.roomStore.meeting?.meetingId,
      meetingSubId: roomService.roomStore.meeting?.meetingSubId,
    };

    const baseUrl = window.location.href.split("#")[0];

    const newWin = window.open(
      `${baseUrl}#/sharing-dropdown-menu?${handlerPathParams(query)}`,
      "_blank",
      "width=160,height=80",
    );

    dropdownWindow.value = newWin;
  };

  const installEventHandlers = () => {
    roomService
      .on(RoomEventEnum.PERMISSION_UPDATED, () => {
        navigation.emit(StoreEventEnum.UpdateMeetingPermission);
      })
      .on(RoomEventEnum.ROOM_MEMBER_UPDATE, () => {
        navigation.emit(
          StoreEventEnum.RoomMemberUpdate,
          toRaw(roomService.roomStore.userList),
        );
      })
      .on(RoomEventEnum.TXWhiteBoardExt, (data) => {
        navigation.emit(StoreEventEnum.UpdateDrawingBoard, data);
      })
      .on(RoomEventEnum.TEDU_BOARD_SYNC_DATA, (data) => {
        navigation.emit(StoreEventEnum.WhiteboardSendAddAckData, data);
      })
      .on(RoomEventEnum.NET_STATE_CONNECTED, () => {
        navigation.emit(StoreEventEnum.WhiteboardSendAddAckData);
      })
      .on(RoomEventEnum.SECURE_UPDATE, () => {
        navigation.emit(StoreEventEnum.UpdateMeetingSecure, {
          meetingId: meeting.value.meetingSubId,
        });
      });
  };

  const uninstallEventHandlers = () => {
    roomService
      .off(RoomEventEnum.PERMISSION_UPDATED, () => {})
      .off(RoomEventEnum.ROOM_MEMBER_UPDATE, () => {})
      .off(RoomEventEnum.TXWhiteBoardExt, (data) => {})
      .off(RoomEventEnum.TEDU_BOARD_SYNC_DATA, (data) => {})
      .off(RoomEventEnum.NET_STATE_CONNECTED, () => {})
      .on(RoomEventEnum.SECURE_UPDATE, () => {});
  };

  onMounted(() => {
    navigation
      .on(StoreEventEnum.HideSharingMenuDropdown, () => {
        visibleModel.value && resume();
      })
      .on(StoreEventEnum.UpdateMeetingSecure, () => {
        updateMeetingLock({
          meetingId: roomService.roomStore.meeting.meetingId,
        }).then((res) => {
          roomService.roomAction.updateSecureInfo({
            isLockEnabled: res?.data?.isLocked ?? false,
            isWaitingRoomEnabled: res?.data?.isOpenWaitingRoom ?? false,
          });
        });

        roomService.roomAction.publishData({
          command: DataChannelCommand.UpdateSecure,
          message: "",
        });
      });
  });

  watch(visibleModel, async (val) => {
    if (val) {
      !dropdownWindow.value && createDropdownWindow();

      installEventHandlers();

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

      uninstallEventHandlers();
    }
  });

  return {
    tipRef,
    menuRef,
    showDetail,
    loading,
    dropdownMenuLoading,
    meeting,
    isHost,
    recordingState,
    memberSize,
    handleEndShare,
    pause,
    resume,
    onOpenMenu,
    onOpenMemberList,
    onStopShare,
  };
};
