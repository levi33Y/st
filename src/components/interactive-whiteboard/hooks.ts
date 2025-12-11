import { VideoSizeInfo } from "@/entity/types";
import genTestUserSig from "@/screens/room/config/gen-test-user-sig";
import { useDrawingStore } from "@/stores/useDrawingStore";
import { useTrtcKeyStore } from "@/stores/useTrtc";
import { onMounted, reactive, ref, watch } from "vue";
import { DrawingTool, StoreEventEnum } from "../../entity/enum";
import DrawingTools from "./components/drawing-tools/index.vue";

export interface IProps {
  isMaster: boolean;
  userInfo: {
    userSid: string;
    meetingNumber: string;
  };
}

export interface IEmitsProps {
  (event: "tEduBoardEvent", message: { type: string; data: string }): void;
}

export function useAction(emits: IEmitsProps, props: IProps) {
  const drawingStore = useDrawingStore();
  const trTcKeyStore = useTrtcKeyStore();
  const drawingToolsRef = ref<InstanceType<typeof DrawingTools>>();
  const container = ref<HTMLDivElement>();
  const tEduBoard = ref();
  const isReady = ref(false);
  const isError = ref(false);
  const isHistoryCompleted = ref(false);
  const state = reactive({
    drawingTool: DrawingTool.Cursor,
    isDrawing: false,
    point: { x: 0, y: 0 },
    isShowDrawingTool: false,
  });
  const drawingToolEnum = reactive(DrawingTool);

  const toggleDrawingTool = () => {
    if (!drawingToolsRef?.value || isError.value) {
      console.log("白板未初始化或出现错误，无法切换工具");

      return;
    }

    if (!state.isShowDrawingTool) {
      onChange(DrawingTool.Brush);
      window.store.dispatch(StoreEventEnum.ReserveShareCanvasMouse, "");
    } else {
      onChange(DrawingTool.Cursor);
      window.store.dispatch(StoreEventEnum.IgnoreShareCanvasMouse, "");
    }

    state.isShowDrawingTool = !state.isShowDrawingTool;
  };

  const closeDrawingTool = () => {
    onChange(DrawingTool.Cursor);
    state.isShowDrawingTool = false;
  };

  const onChange = (tool: DrawingTool) => {
    switch (tool) {
      case DrawingTool.Cursor:
        state.drawingTool = tool;
        tEduBoard.value.setToolType(0);
        break;
      case DrawingTool.Brush:
        state.drawingTool = tool;
        tEduBoard.value.setToolType(1);
        break;
      case DrawingTool.Eraser:
        state.drawingTool = tool;
        tEduBoard.value.setToolType(2);
        break;
    }
  };

  const onAction = (tool: DrawingTool) => {
    switch (tool) {
      case DrawingTool.Undo:
        tEduBoard.value.undo();
        break;
      case DrawingTool.Redo:
        tEduBoard.value.redo();
        break;
      case DrawingTool.Clear:
        tEduBoard.value.clear();
        break;
    }
  };

  const remoteDrawing = (data: any) => {
    tEduBoard.value.addSyncData(JSON.parse(data));
  };

  const resize = (videoSizeInfo: VideoSizeInfo) => {
    if (!container.value || !tEduBoard.value) return;
    container.value.style.width = `${videoSizeInfo.currentVideoWidth}px`;
    container.value.style.height = `${videoSizeInfo.currentVideoHeight}px`;
    tEduBoard.value.resize();
  };

  const reset = () => {
    tEduBoard.value?.clear();

    tEduBoard.value?.reset();
  };

  const addAckData = (data: string) => {
    try {
      tEduBoard.value?.addAckData(JSON.parse(data));
    } catch (error) {
      console.error("解析addAckDataJSON 出错:", error, "原始数据:", data);
    }
  };

  const syncAndReload = () => {
    isHistoryCompleted.value && tEduBoard.value?.syncAndReload();
  };

  const initTEduBoard = () => {
    const sdkInfo = genTestUserSig(
      props.userInfo.userSid,
      trTcKeyStore.appId,
      trTcKeyStore.sdkSecretKey,
    );

    const initParams = {
      id: "whiteboard-container",
      classId: props.userInfo.meetingNumber,
      sdkAppId: sdkInfo.sdkAppId,
      userId: props.userInfo.userSid,
      userSig: sdkInfo.userSig,
      styleConfig: {
        brushColor: drawingStore.lineColor,
        brushThin: drawingStore.lineSize * 10,
        cursorSize: [10, 20],
        globalBackgroundColor: "rgba(0,0,0,0)",
      },
    };

    tEduBoard.value = new window.TEduBoard(initParams);

    tEduBoard.value.on(
      window.TEduBoard.EVENT.TEB_INIT,
      (code: string, msg: string) => {
        console.log("======================:  ", "TEB_INIT");
        tEduBoard.value.setRemoteCursorVisible(false);
        tEduBoard.value.setRemoteCursorVisible(false, 0);
        // tEduBoard.value.setDrawEnable(false);
        // tEduBoard.value.disablePermissionChecker(
        //   ["File::*::*", "Board::*::*", "Element::*::*"],
        //   [`creator/${props.userInfo.userSid}`],
        // );
        onChange(DrawingTool.Cursor);
        window.store.dispatch(StoreEventEnum.WhiteboardReady, "");
        isReady.value = true;
      },
    );

    tEduBoard.value.on(window.TEduBoard.EVENT.TEB_SYNCDATA, (data: any) => {
      emits("tEduBoardEvent", {
        type: "TEB_SYNCDATA",
        data: JSON.stringify(data),
      });
    });

    tEduBoard.value.on(
      window.TEduBoard.EVENT.TEB_BOARD_PERMISSION_CHANGED,
      (permissions: any, filters: any) => {
        console.log("TEB_BOARD_PERMISSION_CHANGED", permissions, filters);
      },
    );

    tEduBoard.value.on(
      window.TEduBoard.EVENT.TEB_HISTROYDATA_SYNCCOMPLETED,
      () => {
        console.log(
          "======================:  ",
          "TEB_HISTROYDATA_SYNCCOMPLETED",
        );

        isHistoryCompleted.value = true;

        window.store.dispatch(StoreEventEnum.WhiteboardHistoryData, "");
      },
    );

    tEduBoard.value.on(
      window.TEduBoard.EVENT.TEB_ERROR,
      (errorCode: number, errorMessage: string) => {
        let displayMessage: string = errorMessage || "未知错误，请重试。"; // 默认错误信息

        switch (errorCode) {
          case 1: // TEDU_BOARD_ERROR_INIT
            displayMessage = "白板初始化失败，请检查配置或稍后重试。";
            break;
          case 2: // TEDU_BOARD_ERROR_AUTH
            displayMessage =
              "服务鉴权失败，请检查您的腾讯云白板服务是否已购买或配置正确。";
            break;
          case 3: // TEDU_BOARD_ERROR_LOAD
            displayMessage =
              "白板加载失败，可能是网络问题或资源加载异常，请重试。";
            break;
          case 6: // TEDU_BOARD_ERROR_HISTORYDATA
            displayMessage = "同步历史数据失败，请检查网络连接或稍后重试。";

            isHistoryCompleted.value = false;
            break;
          case 7: // TEDU_BOARD_ERROR_RUNTIME
            displayMessage =
              "白板运行错误，请检查 SDKAppID、UserID、UserSig 是否正确，并核对错误信息。";
            break;
          case 8: // TEDU_BOARD_ERROR_AUTH_TIMEOUT
            displayMessage =
              "服务鉴权超时，可能是网络不稳定或服务器响应慢，请重试。";
            break;
          case 10: // TEDU_BOARD_MAX_BOARD_LIMITED
            displayMessage =
              "当前课堂内白板页数已达到上限，无法继续添加新页面。";
            break;
          case 11: // TEDU_BOARD_SIGNATURE_EXPIRED
            displayMessage = "您的白板签名已过期，请刷新页面或重新获取权限。";
            break;
          default:
            // 对于未明确列出的错误码，使用SDK返回的原始错误信息
            displayMessage = `白板发生未知错误 (${errorCode})：${
              errorMessage || "请联系技术支持。"
            }`;
            break;
        }

        isError.value = true;

        console.log(
          "======================:  ",
          "TEB_ERROR",
          " errorCode:",
          errorCode,
          " errorMessage:",
          errorMessage,
        );
      },
    );

    tEduBoard.value.on(
      window.TEduBoard.EVENT.TEB_WARNING,
      (warnCode: number, warnMessage: string) => {
        let displayMessage: string = warnMessage || "未知警告。";

        switch (warnCode) {
          case 1: // TEDU_BOARD_WARNING_SYNC_DATA_PARSE_FAILED
            displayMessage =
              "接收到其他端同步数据解析错误，请检查是否将非白板信令同步到了白板中。";
            break;
          case 3: // TEDU_BOARD_WARNING_H5PPT_ALREADY_EXISTS
            displayMessage = "要添加的动态PPT已存在，请勿重复添加。";
            break;
          case 5: // TEDU_BOARD_WANNING_ILLEGAL_OPERATION
            displayMessage =
              "非法操作：历史数据同步未完成，禁止改变白板行为。请等待同步完成。";
            break;
          case 6: // TEDU_BOARD_WARNING_H5FILE_ALREADY_EXISTS
            displayMessage = "要添加的网页文件已存在，请勿重复添加。";
            break;
          case 7: // TEDU_BOARD_WARNING_VIDEO_ALREADY_EXISTS
            displayMessage = "要添加的视频已存在，请勿重复添加。";
            break;
          case 8: // TEDU_BOARD_WARNING_IMAGESFILE_ALREADY_EXISTS
            displayMessage = "要添加的图片集合文件已存在，请勿重复添加。";
            break;
          case 9: // TEDU_BOARD_WARNING_GRAFFITI_LOST
            displayMessage = "部分涂鸦可能丢失，请检查。";
            break;
          case 10: // TEDU_BOARD_WARNING_CUSTOM_GRAPH_URL_NON_EXISTS
            displayMessage = "自定义图形的URL不存在，请检查配置。";
            break;
          case 11: // TEDU_BOARD_WARNING_IMAGESFILE_TOO_LARGE
            displayMessage = "添加图片集合文件内容过大，请优化文件大小。";
            break;
          case 12: // TEDU_BOARD_WARNING_IMAGE_COURSEWARE_ALREADY_EXISTS
            displayMessage = "要添加的静态转码课件已存在，请勿重复添加。";
            break;
          case 13: // TEDU_BOARD_WARNING_IMAGE_MEDIA_BITRATE_TOO_LARGE
            displayMessage = "多媒体资源码率过大，可能影响播放流畅度。";
            break;
          case 14: // TEDU_BOARD_WARNING_IMAGE_WATERMARK_ALREADY_EXISTS
            displayMessage = "重复添加图片水印，请检查。";
            break;
          case 15: // TEDU_BOARD_WARNING_FORMULA_LIB_NOT_LOADED
            displayMessage = "数学公式库加载失败，部分功能可能受限。";
            break;
          case 16: // TEDU_BOARD_WARNING_ILLEGAL_FORMULA_EXPRESSION
            displayMessage = "非法的数学公式表达式，请检查输入。";
            break;
          case 17: // TEDU_BOARD_WARNING_TEXT_WATERMARK_ALREADY_EXISTS
            displayMessage = "重复添加文字水印，请检查。";
            break;
          case 18: // TEDU_BOARD_WARNING_EXPORTIMPORT_FILTERRULE_ILLEGAL
            displayMessage = "导入导出过滤规则非法，请检查配置。";
            break;
          case 19: // TEDU_BOARD_WARNING_ELEMENTTYPE_NOT_EXISTS
            displayMessage = "元素类型不存在，请检查操作。";
            break;
          case 20: // TEDU_BOARD_WARNING_ELEMENTID_NOT_EXISTS
            displayMessage = "元素ID不存在，请检查操作。";
            break;
          case 21: // TEDU_BOARD_WARNING_ELEMENT_IS_LOCKED
            displayMessage = "元素当前处于锁定状态，不允许操作。";
            break;
          case 22: // TEDU_BOARD_WARNING_FILE_NOT_FOUND
            displayMessage = "文件未找到，请重新添加文件。";
            break;
          case 23: // TEDU_BOARD_WARNING_SEPT_RATE_LIMITING
            displayMessage =
              "上一步/下一步操作频率过快，请稍后再试（500ms限制）。";
            break;
          case 24: // TEDU_BOARD_WARNING_DOWNGRADE
            displayMessage =
              "H5PPT加载失败，已降级为缩略图模式，部分交互可能受限。";
            break;
          default:
            // 对于未明确列出的警告码，使用SDK返回的原始警告信息
            displayMessage = `白板发生未知警告 (${warnCode})：${
              warnMessage || "请联系技术支持。"
            }`;
            break;
        }

        console.log(
          "======================:  ",
          "TEB_WARNING",
          " warnCode:",
          warnCode,
          " warnMessage:",
          warnMessage,
          "warnMessage",
          displayMessage,
        );
      },
    );
  };

  onMounted(() => {
    initTEduBoard();
  });

  watch(
    () => isError.value,
    (val) => {
      if (val) {
        console.log("重新初始化白板");

        closeDrawingTool();

        isReady.value = false;

        isHistoryCompleted.value = false;

        isError.value = false;

        tEduBoard.value.destroy();

        initTEduBoard();
      }
    },
  );

  watch(
    () => drawingStore.lineSize,
    () => {
      tEduBoard.value &&
        tEduBoard.value.setBrushThin(drawingStore.lineSize * 10);
    },
  );

  watch(
    () => drawingStore.lineColor,
    () => {
      tEduBoard.value && tEduBoard.value.setBrushColor(drawingStore.lineColor);
    },
  );

  return {
    drawingToolsRef,
    container,
    drawingToolEnum,
    state,
    isReady,
    isHistoryCompleted,
    onChange,
    onAction,
    remoteDrawing,
    toggleDrawingTool,
    closeDrawingTool,
    resize,
    reset,
    addAckData,
    syncAndReload,
  };
}
