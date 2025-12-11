import { useMeetingStore } from "@/stores/useMeetingStore";
import { fabric } from "fabric";
import { isEmpty, isNil } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { computed, nextTick, onMounted, reactive, ref, toRaw } from "vue";
import { DrawingStep, DrawingTool, StoreEventEnum } from "../../entity/enum";
import { DrawingRecord, Point, VideoSizeInfo } from "../../entity/types";
import { useAppStore } from "../../stores/useAppStore";
import { useDrawingStore } from "../../stores/useDrawingStore";
import DrawingTools from "./components/drawing-tools/index.vue";
import { Drawing } from "./utils";

export interface Props {
  moderator: string;
}

export interface Emits {
  (event: "drawing", drawingRecord: DrawingRecord): void;
}

export const useAction = (emits: Emits, props: Props) => {
  const drawingToolsRef = ref<InstanceType<typeof DrawingTools>>();

  const appStore = useAppStore();

  const meetingStore = useMeetingStore();

  const drawingStore = useDrawingStore();

  const container = ref<HTMLDivElement>();

  const canvasEl = ref<HTMLCanvasElement>();

  const drawing = ref<Drawing>();

  const drawingToolEnum = reactive(DrawingTool);

  const textElement = ref<fabric.Textbox>();

  const isModerator = computed(() => {
    return isNil(props.moderator) || isEmpty(props.moderator);
  });

  const points = ref<Point[]>([]); // 鼠标down到up的Points

  const historyDrawingRecords = ref<DrawingRecord[]>([]); // 历史记录

  const undoDrawingRecords = ref<DrawingRecord[]>([]); // 撤销记录

  const state = reactive<{
    drawingTool: DrawingTool;
    isDrawing: boolean;
    point: Point;
    isShowDrawingTool: boolean;
  }>({
    drawingTool: DrawingTool.Cursor, // 默认是鼠标
    isDrawing: false,
    point: { x: 0, y: 0 }, // 鼠标down之后的鼠标Point
    isShowDrawingTool: false, // 是否显示画板
  });

  // 当前帧的画笔Points
  let currentRecord: DrawingRecord = {
    id: "",
    userId: appStore.userInfo.id,
    tool: DrawingTool.Brush,
    size: 0,
    color: "",
    points: [],
    step: DrawingStep.Start,
  };

  const resize = (videoSizeInfo: VideoSizeInfo) => {
    drawing.value!.resize(videoSizeInfo);
    historyDrawingRecords.value.forEach((record) => {
      const points = drawing.value!.originalConvertCurrentPoints(record.points);
      const path = drawing.value!.createFabricPath(
        points,
        record.size,
        record.color,
      );
      record.fabric = path;
    });
  };

  const onDrawing = (drawingRecord: DrawingRecord) =>
    emits("drawing", drawingRecord);

  const remoteDrawing = (drawingRecord: DrawingRecord) => {
    switch (drawingRecord.tool) {
      case DrawingTool.Brush: {
        switch (drawingRecord.step) {
          case DrawingStep.Start: {
            historyDrawingRecords.value.push(drawingRecord);
            return;
          }
          case DrawingStep.Process: {
            const record = historyDrawingRecords.value.find(
              (record) => record.id === drawingRecord.id,
            );
            if (record) {
              const points = drawingRecord.points.map((point) => ({
                ...point,
              }));
              const startPoint = drawing.value!.originalConvertCurrentPoints([
                record.points[record.points.length - 1],
              ])[0];
              const movePoints =
                drawing.value!.originalConvertCurrentPoints(points);
              drawing.value!.createPath(
                startPoint,
                movePoints,
                record.size,
                record.color,
              );
              record.step = drawingRecord.step;
              record.points.push(...points);
            } else {
              historyDrawingRecords.value.push(drawingRecord);
            }
            return;
          }
          case DrawingStep.End: {
            const record = historyDrawingRecords.value.find(
              (record) => record.id === drawingRecord.id,
            );
            if (record) {
              drawing.value!.clearContext();
              const points = drawing.value!.originalConvertCurrentPoints(
                drawingRecord.points,
              );
              const path = drawing.value!.createFabricPath(
                points,
                record.size,
                record.color,
              );

              record.points = drawingRecord.points;
              record.step = drawingRecord.step;
              record.fabric = path;
            }
            return;
          }
        }
      }
      case DrawingTool.Eraser: {
        break;
      }
      case DrawingTool.Undo: {
        const record = historyDrawingRecords.value.find(
          (record) => record.id === drawingRecord.id,
        );
        if (record && record.fabric) {
          // 移除当前记录
          historyDrawingRecords.value = historyDrawingRecords.value.filter(
            (record) => record.id !== drawingRecord.id,
          );
          // 从画板上删除
          drawing.value?.canvas.remove(record.fabric);
          // 添加到撤销记录中
          undoDrawingRecords.value.push(toRaw(record));
        }
        return;
      }
      case DrawingTool.Redo: {
        const record = undoDrawingRecords.value.find(
          (record) => record.id === drawingRecord.id,
        );
        if (record && record.fabric) {
          switch (record.tool) {
            case DrawingTool.Brush: {
              undoDrawingRecords.value = undoDrawingRecords.value.filter(
                (record) => record.id !== drawingRecord.id,
              );
              // 添加到画板上
              const points = drawing.value!.originalConvertCurrentPoints(
                drawingRecord.points,
              );
              const path = drawing.value!.createFabricPath(
                points,
                record.size,
                record.color,
              );
              record.fabric = path;
              // 添加到历史记录中
              historyDrawingRecords.value.push(toRaw(record));
              return;
            }
          }
        } else {
          switch (drawingRecord.drawingTool) {
            case DrawingTool.Brush: {
              const points = drawing.value!.originalConvertCurrentPoints(
                drawingRecord.points,
              );
              const path = drawing.value!.createFabricPath(
                points,
                drawingRecord.size,
                drawingRecord.color,
              );
              drawingRecord.fabric = path;
              historyDrawingRecords.value.push(drawingRecord);
              return;
            }
          }
        }
        return;
      }
      case DrawingTool.Clear: {
        if (drawingRecord.userId + "" === meetingStore.shareScreenUserId + "") {
          drawing.value!.canvas.clear();
          points.value = [];
          undoDrawingRecords.value = [];
          historyDrawingRecords.value = [];
        } else {
          const mineDraw = historyDrawingRecords.value.filter(
            (item) => item.userId === drawingRecord.userId,
          );

          drawing.value!.canvas.getObjects().forEach((obj) => {
            mineDraw.forEach((mineObj) => {
              if (toRaw(mineObj.fabric) === toRaw(obj)) {
                mineObj.fabric && drawing.value!.canvas.remove(mineObj.fabric);
              }
            });
          });

          undoDrawingRecords.value = undoDrawingRecords.value.filter(
            (item) => item.userId !== drawingRecord.userId,
          );

          historyDrawingRecords.value = historyDrawingRecords.value.filter(
            (item) => item.userId !== drawingRecord.userId,
          );
        }
        return;
      }
      case DrawingTool.Init: {
        // 重進會議，回顯批注
        const points = drawingRecord.points.map((point) => ({
          ...point,
        }));
        const startPoint = drawing.value!.originalConvertCurrentPoints([
          drawingRecord.points[drawingRecord.points.length - 1],
        ])[0];
        const movePoints = drawing.value!.originalConvertCurrentPoints(points);
        drawing.value!.createPath(
          startPoint,
          movePoints,
          drawingRecord.size,
          drawingRecord.color,
        );
        drawingRecord.step = drawingRecord.step;
        drawingRecord.points.push(...points);

        historyDrawingRecords.value.push(drawingRecord);
        return;
      }
    }
  };

  const onChange = (drawingTool: DrawingTool) => {
    state.drawingTool = drawingTool;
    drawing.value?.canvas && (drawing.value.canvas.skipTargetFind = true);
    switch (drawingTool) {
      case DrawingTool.Eraser:
        drawing.value?.canvas && (drawing.value.canvas.skipTargetFind = false);
        break;
    }
  };

  const onAction = (drawingTool: DrawingTool) => {
    drawing.value!.canvas.skipTargetFind = true;

    switch (drawingTool) {
      case DrawingTool.Undo: {
        let drawingRecord: DrawingRecord | undefined;

        if (isModerator.value) {
          drawingRecord = historyDrawingRecords.value.pop();
        } else {
          const filteredList = historyDrawingRecords.value.filter(
            (item) => item.userId === appStore.userInfo.id,
          );
          if (filteredList.length > 0) {
            const record = filteredList.pop();

            historyDrawingRecords.value = historyDrawingRecords.value.filter(
              (item) => item.id !== record?.id,
            );

            drawingRecord = record;
          }
        }

        if (!drawingRecord) return;

        drawing.value!.remove(drawingRecord.fabric);
        // 添加到撤销记录中
        undoDrawingRecords.value.push(toRaw(drawingRecord));

        onDrawing({
          ...drawingRecord,
          drawingTool: drawingRecord.tool,
          tool: DrawingTool.Undo,
          fabric: undefined,
        });

        return;
      }
      case DrawingTool.Redo: {
        let drawingRecord: DrawingRecord | undefined;

        if (isModerator.value) {
          drawingRecord = undoDrawingRecords.value.pop();
        } else {
          const filteredList = undoDrawingRecords.value.filter(
            (item) => item.userId === appStore.userInfo.id,
          );
          if (filteredList.length > 0) {
            const record = filteredList.pop();

            undoDrawingRecords.value = undoDrawingRecords.value.filter(
              (item) => item.id !== record?.id,
            );

            drawingRecord = record;
          }
        }

        if (drawingRecord && drawingRecord.fabric) {
          // 添加到画板上
          const points = drawing.value!.originalConvertCurrentPoints(
            drawingRecord.points,
          );
          const path = drawing.value!.createFabricPath(
            points,
            drawingRecord.size,
            drawingRecord.color,
          );
          drawingRecord.fabric = path;
          // 添加到历史记录中
          historyDrawingRecords.value.push(toRaw(drawingRecord));
          onDrawing({
            ...drawingRecord,
            drawingTool: drawingRecord.tool,
            tool: DrawingTool.Redo,
            fabric: undefined,
          });
        }
        return;
      }
      case DrawingTool.Clear: {
        if (isModerator.value) {
          drawing.value!.canvas.clear();
          points.value = [];
          undoDrawingRecords.value = [];
          historyDrawingRecords.value = [];
          onDrawing({
            id: uuidv4(),
            userId: appStore.userInfo.id,
            tool: DrawingTool.Clear,
            size: 0,
            color: "",
            points: [],
            step: DrawingStep.End,
          });
        } else {
          const mineDraw = historyDrawingRecords.value.filter(
            (item) => item.userId === appStore.userInfo.id,
          );

          undoDrawingRecords.value = undoDrawingRecords.value.filter(
            (item) => item.userId !== appStore.userInfo.id,
          );

          historyDrawingRecords.value = historyDrawingRecords.value.filter(
            (item) => item.userId !== appStore.userInfo.id,
          );

          drawing.value!.canvas.getObjects().forEach((obj) => {
            mineDraw.forEach((mineObj) => {
              if (toRaw(mineObj.fabric) === toRaw(obj)) {
                mineObj.fabric && drawing.value!.canvas.remove(mineObj.fabric);
              }
            });
          });

          onDrawing({
            id: uuidv4(),
            userId: appStore.userInfo.id,
            tool: DrawingTool.Clear,
            size: 0,
            color: "",
            points: [],
            step: DrawingStep.End,
          });
        }
        return;
      }
    }
  };

  const toggleDrawingTool = () => {
    if (!drawingToolsRef?.value) return;

    if (!state.isShowDrawingTool) {
      state.drawingTool = DrawingTool.Brush;

      window.store.dispatch(StoreEventEnum.ReserveShareCanvasMouse, "");
    } else {
      window.store.dispatch(StoreEventEnum.IgnoreShareCanvasMouse, "");
    }

    state.isShowDrawingTool = !state.isShowDrawingTool;
  };

  const closeDrawingTool = () => {
    state.isShowDrawingTool = false;
    state.drawingTool = DrawingTool.Cursor;
  };

  const removeRecord = (e?: fabric.Object) => {
    if (!e) return;

    const drawingRecord = historyDrawingRecords.value.find(
      (record) => toRaw(record.fabric) === e,
    );

    if (!drawingRecord) return;

    // 只有主持人或自己的笔迹才允许删除
    if (!(isModerator.value || drawingRecord.userId === appStore?.userInfo.id))
      return;

    // 更新状态
    historyDrawingRecords.value = historyDrawingRecords.value.filter(
      (record) => record.id !== drawingRecord.id,
    );

    // 更新画布
    drawing.value!.remove(drawingRecord.fabric);

    // 加入撤销栈
    undoDrawingRecords.value.push(toRaw(drawingRecord));

    // 广播删除事件
    onDrawing({
      id: drawingRecord.id,
      userId: drawingRecord.userId,
      tool: DrawingTool.Eraser,
      size: 0,
      color: "",
      points: drawingRecord.points,
      step: drawingRecord.step,
    });
  };

  const mousedown = (e: fabric.IEvent<MouseEvent>) => {
    const point: Point = { x: e.pointer!.x, y: e.pointer!.y };
    state.point = { ...point };
    points.value = [{ ...point }];

    switch (state.drawingTool) {
      case DrawingTool.Brush: {
        state.isDrawing = true;
        undoDrawingRecords.value = [];
        currentRecord = {
          id: uuidv4(),
          userId: appStore.userInfo.id,
          tool: DrawingTool.Brush,
          size: drawingStore.lineSize,
          color: drawingStore.lineColor,
          points: [],
          step: DrawingStep.Start,
        };
        const points = drawing.value!.currentConvertOriginalPoints([point]);
        onDrawing({ ...currentRecord, points });
        return;
      }
      case DrawingTool.Text: {
        if (textElement.value) {
          textElement.value.exitEditing();
          textElement.value.hiddenTextarea?.blur();
          textElement.value = undefined;
        } else {
          const text = new fabric.Textbox("", {
            left: point.x,
            top: point.y,
            width: 150,
            fontSize: 20,
            editable: true,
            editingBorderColor: "#FF0000",
            hasBorders: true,
            borderColor: "#FF0000",
            hasControls: true,
            selectable: false,
          });
          drawing.value!.canvas.add(text);
          text.enterEditing();
          text.hiddenTextarea?.focus();
          textElement.value = text;
        }
      }
      case DrawingTool.Eraser: {
        removeRecord(e.target);

        break;
      }
    }
  };

  const mousemove = (e: fabric.IEvent<MouseEvent>) => {
    const point: Point = { x: e.pointer!.x, y: e.pointer!.y };
    const prevPoint = toRaw(state.point);
    state.point = { ...point };
    points.value.push({ ...point });

    switch (state.drawingTool) {
      case DrawingTool.Brush: {
        if (!state.isDrawing) {
          break;
        }

        drawing.value!.createPath(
          prevPoint,
          [{ ...point }],
          undefined,
          "transparent",
        );
        currentRecord.step = DrawingStep.Process;

        currentRecord.points.push({ ...point });
        requestAnimationFrame(() => {
          if (currentRecord.points.length > 0) {
            const points = currentRecord.points.map((point) => ({ ...point }));
            onDrawing({
              ...currentRecord,
              points: drawing.value!.currentConvertOriginalPoints(points),
            });
            currentRecord.points = [];
          }
        });

        break;
      }
      case DrawingTool.Eraser: {
        // removeRecord(e.target)

        break;
      }
      default:
        break;
    }
  };

  const mouseup = (e: fabric.IEvent<MouseEvent>) => {
    if (state.drawingTool === DrawingTool.Brush) {
      state.isDrawing = false;

      drawing.value?.clearContext();
      const path = drawing.value!.createFabricPath(
        points.value,
        undefined,
        "transparent",
      );

      requestAnimationFrame(() => {
        currentRecord.step = DrawingStep.End;

        const targetPoints = drawing.value!.currentConvertOriginalPoints(
          toRaw(points.value).map((point) => ({ ...point })),
        );
        onDrawing({
          ...currentRecord,
          points: targetPoints,
        });
        historyDrawingRecords.value.push({
          ...currentRecord,
          points: targetPoints,
          fabric: path,
        });
      });
    }
  };

  onMounted(() => {
    drawingStore.lineColor = isModerator ? "#e62222" : "#146fff";

    nextTick(() => {
      const canvas = new fabric.Canvas("canvas", {
        skipTargetFind: true,
        isDrawingMode: false,
        selection: false,
      });
      canvas
        .on("mouse:down", mousedown)
        .on("mouse:move", mousemove)
        .on("mouse:up", mouseup);
      drawing.value = new Drawing(canvas);
    });
  });

  return {
    drawingToolsRef,
    container,
    canvasEl,
    drawingToolEnum,
    isModerator,
    state,
    points,
    historyDrawingRecords,
    undoDrawingRecords,
    appStore,
    onChange,
    onAction,
    remoteDrawing,
    resize,
    toggleDrawingTool,
    closeDrawingTool,
  };
};
