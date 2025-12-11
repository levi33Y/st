import InteractiveWhiteboard from "@/screens/trtc-room/components/interactive-whiteboard/index.vue";
import { WhiteboardEventEnum } from "@/utils/trtc/hook/useMitt";
import { RoomEventEnum, roomService } from "@/utils/trtc/roomService";
import { useResizeObserver } from "@vueuse/core";
import { isNil } from "lodash";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

export const useAction = () => {
  const drawingBoardRef = ref<InstanceType<typeof InteractiveWhiteboard>>();

  const videoRef = ref<HTMLVideoElement>();

  const videoSizeInfo = reactive({
    width: 0,
    height: 0,
    videoWidth: 0,
    videoHeight: 0,
    currentVideoWidth: 0,
    currentVideoHeight: 0,
    ratio: 0,
  });

  const stream = computed(() => {
    return roomService.roomStore.screenStream;
  });

  const user = computed(() => roomService.roomStore?.localUser ?? {});

  const meeting = computed(() => roomService.roomStore?.meeting ?? {});

  const isSharingScreen = computed(
    () => !isNil(roomService.roomStore?.localUser?.screenShareStream),
  );

  const update = () => {
    const { width, height, videoWidth, videoHeight } = videoSizeInfo;

    const aspectRatio = videoWidth / videoHeight;

    if (width / height > aspectRatio) {
      videoSizeInfo.currentVideoWidth = height * aspectRatio;
      videoSizeInfo.currentVideoHeight = height;
    } else {
      videoSizeInfo.currentVideoWidth = width;
      videoSizeInfo.currentVideoHeight = width / aspectRatio;
    }

    videoSizeInfo.ratio = videoSizeInfo.currentVideoWidth / videoWidth;

    drawingBoardRef.value?.resize(videoSizeInfo);
  };

  const tEduBoardEvent = (query: { type: string; data: any }) => {
    switch (query.type) {
      case "TEB_SYNCDATA":
        roomService.roomAction.tEduBoardEventTebSyncData(
          query.data,
          (value) => {
            if (value) {
              drawingBoardRef.value?.addAckData(value);
            } else {
              drawingBoardRef.value?.syncAndReload();
            }
          },
        );

        break;
      default:
        break;
    }
  };

  useResizeObserver(videoRef, (entries) => {
    const entry = entries[0];
    const { width, height } = entry.contentRect;
    videoSizeInfo.width = width;
    videoSizeInfo.height = height;
    if (
      videoRef.value &&
      videoRef.value.videoWidth > 0 &&
      videoRef.value.videoHeight > 0
    ) {
      const { videoWidth = 0, videoHeight = 0 } = videoRef.value!;
      videoSizeInfo.videoWidth = videoWidth;
      videoSizeInfo.videoHeight = videoHeight;
      update();
    }
  });

  watch(stream, (pre, sub) => {
    if (isNil(pre) && !isNil(sub)) {
      nextTick(() => {
        videoRef.value?.addEventListener("loadeddata", () => {
          if (!videoRef.value) {
            return;
          }
          const { videoWidth, videoHeight } = videoRef.value!;
          videoSizeInfo.videoWidth = videoWidth;
          videoSizeInfo.videoHeight = videoHeight;
          update();
        });
      });
    }
  });

  onMounted(() => {
    roomService
      .on(RoomEventEnum.WHITEBOARD_EVENT, (type) => {
        if (type === WhiteboardEventEnum.ToggleDrawingTool) {
          drawingBoardRef.value?.toggleDrawingTool();
        }
      })
      .on(RoomEventEnum.TEDU_BOARD_SYNC_DATA, (data) => {
        data && drawingBoardRef.value?.addAckData(data);
      })
      .on(RoomEventEnum.TXWhiteBoardExt, (data) => {
        data && drawingBoardRef.value?.syncData(data);
      })
      .on(RoomEventEnum.NET_STATE_CONNECTED, () => {
        drawingBoardRef.value?.syncAndReload();
      });
  });

  const whiteboardError = () => {
    drawingBoardRef.value?.closeDrawingTool();

    roomService.emit(
      RoomEventEnum.WHITEBOARD_EVENT,
      WhiteboardEventEnum.WhiteboardError,
    );
  };

  const WhiteboardReady = () => {
    roomService.emit(
      RoomEventEnum.WHITEBOARD_EVENT,
      WhiteboardEventEnum.WhiteboardReady,
    );
  };

  return {
    videoRef,
    drawingBoardRef,
    stream,
    user,
    meeting,
    isSharingScreen,
    tEduBoardEvent,
    whiteboardError,
    WhiteboardReady,
  };
};
