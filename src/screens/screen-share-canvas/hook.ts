import { StoreEventEnum } from "@/entity/enum";
import { useNavigation } from "@/hooks/useNavigation";
import { useMeetingStore } from "@/stores/useMeetingStore";
import InteractiveWhiteboard from "@components/interactive-whiteboard/index.vue";
import { nextTick, onMounted, ref } from "vue";

export const useAction = () => {
  const navigation = useNavigation();

  const meetingStore = useMeetingStore();

  const drawingBoardRef = ref<InstanceType<typeof InteractiveWhiteboard>>();

  const handleUpdateSize = async (path: string, size: Electron.Rectangle) => {
    await window.electronAPI
      .getCurrentWindow()
      .setSize(size.width, size.height, undefined, path);

    await window.windowControl.show(path, [size.x, size.y]);
  };

  const tEduBoardEvent = (query: { type: string; data: string }) => {
    switch (query.type) {
      case "TEB_SYNCDATA":
        window.store.dispatch(StoreEventEnum.WhiteboardSendMessage, query.data);
        break;
      default:
        break;
    }
  };

  const offWhiteboardHistoryData = ref(false);

  onMounted(async () => {
    const currentDisplay = meetingStore.captureSourcesWindow;

    window.windowControl.setPenetrate("/share-canvas", true);
    //
    // window.windowControl.setLevel("/share-canvas", WindowsLevelEnum.PopUpMenu);

    if (currentDisplay) {
      await handleUpdateSize("/share-canvas", {
        width: window.screen.width,
        height: window.screen.height,
        x: currentDisplay.x,
        y: 0,
      });
    }

    window.winEvents.onClose(async () => {
      drawingBoardRef.value?.reset();
    });
  });

  onMounted(() => {
    window.store.subscribe(async (key, value: string) => {
      switch (key) {
        case StoreEventEnum.UpdateDrawingBoard: {
          break;
        }
        case StoreEventEnum.OpenDrawingTool: {
          console.log("OpenDrawingTool");

          if (!drawingBoardRef.value) return;

          drawingBoardRef.value.toggleDrawingTool();

          break;
        }
        case StoreEventEnum.ReserveShareCanvasMouse: {
          await window.windowControl.setPenetrate("/share-canvas", false);

          break;
        }
        case StoreEventEnum.IgnoreShareCanvasMouse: {
          await window.windowControl.setPenetrate("/share-canvas", true);

          break;
        }
        case StoreEventEnum.WhiteboardSyncData: {
          drawingBoardRef.value?.syncData(value);
          break;
        }
        case StoreEventEnum.WhiteboardSendAddAckData: {
          try {
            if (value) {
              drawingBoardRef.value?.addAckData(value);
            } else {
              drawingBoardRef.value?.syncAndReload();
            }
          } catch {}

          break;
        }
        case StoreEventEnum.EndSharing: {
          drawingBoardRef.value?.reset();

          nextTick(() => {
            navigation.close("/share-canvas");
          });

          break;
        }
        case StoreEventEnum.WhiteboardHistoryData: {
          if (!offWhiteboardHistoryData.value) {
            drawingBoardRef?.value?.reset();

            offWhiteboardHistoryData.value = true;
          }
        }
        default:
          break;
      }
    });
  });

  return {
    drawingBoardRef,
    meetingStore,
    tEduBoardEvent,
  };
};
