import { DrawingTool } from "@/entity/enum";
import { StoreEventEnum, useNavigation } from "@/hooks/useNavigation";
import InteractiveWhiteboard from "@/screens/trtc-room/components/interactive-whiteboard/index.vue";
import { roomService } from "@/utils/trtc/roomService";
import { nextTick, onBeforeMount, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";

interface IMeetingQueryProps {
  sourceId: string;
  sourceName: string;
  width: number;
  height: number;
  x: number;
  y: number;
  userSid: string;
  meetingNumber: string;
  SDKAppID: number;
  SDKSecretKey: string;
}

const pagePath = "/trtc-screen-canvas";

export const useAction = () => {
  const navigation = useNavigation();

  const { query } = useRoute();

  const meetingQuery = reactive<IMeetingQueryProps>({
    sourceId: (query?.sourceId as string) ?? "",
    sourceName: (query?.sourceName as string) ?? "",
    width: Number(query?.width ?? 0),
    height: Number(query?.width ?? 0),
    x: Number(query?.x ?? 0),
    y: Number(query?.y ?? 0),
    userSid: (query?.userSid as string) ?? "",
    meetingNumber: (query?.meetingNumber as string) ?? "",
    SDKAppID: Number(query?.SDKAppID ?? 0),
    SDKSecretKey: (query?.SDKSecretKey as string) ?? "",
  });

  const drawingBoardRef = ref<InstanceType<typeof InteractiveWhiteboard>>();

  const offWhiteboardHistoryData = ref(false);

  const handleUpdateSize = async (path: string, size: Electron.Rectangle) => {
    await window.electronAPI
      .getCurrentWindow()
      .setSize(size.width, size.height, undefined, path);

    await window.windowControl.show(path, [size.x, size.y]);
  };

  const tEduBoardEvent = (query: { type: string; data: any }) => {
    switch (query.type) {
      case "TEB_SYNCDATA":
        navigation.emit(StoreEventEnum.WhiteboardSendMessage, query.data);
        break;
      default:
        break;
    }
  };

  const whiteboardError = async () => {
    await setPenetrate(true);

    navigation.emit(StoreEventEnum.WhiteboardError);
  };

  const WhiteboardReady = () => {
    navigation.emit(StoreEventEnum.WhiteboardReady);

    drawingBoardRef.value?.bus?.on("closeDrawingTool", () => {
      setPenetrate(true);
    });

    drawingBoardRef.value?.bus?.on("change", (type) => {
      if (type === DrawingTool.Cursor) {
        setPenetrate(true);
      } else {
        setPenetrate(false);
      }
    });

    drawingBoardRef.value?.bus?.on("openDrawingTool", () => {
      setPenetrate(false);
    });

    drawingBoardRef.value?.bus?.on("mouseenterDrawingTool", () => {
      setPenetrate(false);
    });

    drawingBoardRef.value?.bus?.on("mouseleaveDrawingTool", () => {
      setPenetrate(true);
    });
  };

  const setPenetrate = async (data: boolean) => {
    await window.windowControl.setPenetrate(pagePath, data);
  };

  const whiteboardHistoryData = () => {
    if (!offWhiteboardHistoryData.value) {
      drawingBoardRef?.value?.reset();

      offWhiteboardHistoryData.value = true;
    }
  };

  onBeforeMount(() => {
    roomService.basicStore.setSDKApp(
      meetingQuery.SDKAppID,
      meetingQuery.SDKSecretKey,
    );
  });

  onMounted(async () => {
    setPenetrate(true);

    // window.windowControl.setLevel(pagePath, WindowsLevelEnum.PopUpMenu);

    await handleUpdateSize(pagePath, {
      width: window.screen.width,
      height: window.screen.height,
      x: meetingQuery?.x ?? 0,
      y: 0,
    });

    window.winEvents.onClose(async () => {
      drawingBoardRef.value?.reset();
    });
  });

  onMounted(() => {
    navigation
      .on(StoreEventEnum.WhiteboardToggleTool, () => {
        if (!drawingBoardRef.value) return;

        drawingBoardRef.value.toggleDrawingTool();
      })
      .on(StoreEventEnum.WhiteboardSyncData, (msg) => {
        drawingBoardRef.value?.syncData(msg);
      })
      .on(StoreEventEnum.WhiteboardSendAddAckData, (msg) => {
        if (msg) {
          drawingBoardRef.value?.addAckData(msg);
        }
      })
      .on(StoreEventEnum.EndSharing, () => {
        drawingBoardRef.value?.reset();

        nextTick(() => {
          navigation.close(pagePath);
        });
      })
      .on(StoreEventEnum.UpdateDrawingBoard, (data) => {
        drawingBoardRef.value?.syncData(data);
      })
      .on(StoreEventEnum.NET_STATE_CONNECTED, (data) => {
        drawingBoardRef.value?.syncAndReload();
      });
  });
  return {
    drawingBoardRef,
    meetingQuery,
    tEduBoardEvent,
    whiteboardError,
    WhiteboardReady,
    whiteboardHistoryData,
  };
};
