import { useResizeObserver, useWindowSize } from "@vueuse/core";
import { onMounted, onUnmounted, reactive, ref, watchEffect } from "vue";
import { DrawingTool, StoreEventEnum } from "../../../../entity/enum";
import { Point } from "../../../../entity/types";

export interface IProps {
  drawingTool: DrawingTool;
  undoDisabled: boolean;
  redoDisabled: boolean;
}

export interface Emits {
  (event: "change", drawingTool: DrawingTool): void;
  (event: "action", drawingTool: DrawingTool): void;
  (event: "close"): void;
}

export const useDragg = (props: IProps) => {
  const container = ref<HTMLElement | null>(null);

  const point = reactive<Point>({ x: 0, y: 0 });

  const startPoint = reactive<Point>({ x: 0, y: 0 });

  const isDown = ref(false);

  const isInit = ref(false);

  const layout = reactive({ width: 699, height: 60 });

  const { width, height } = useWindowSize();

  useResizeObserver(container, (entries) => {
    const entry = entries[0];
    const { width, height } = entry.contentRect;

    if (width > 0 && height > 0 && !isInit.value) {
      isInit.value = true;
      point.x = (document.body.clientWidth - width) / 2;
      point.y = document.body.clientHeight - 112;
    }

    width > 0 && (layout.width = width);
    height > 0 && (layout.height = height);
  });

  const mousedown = (event: MouseEvent) => {
    isDown.value = true;
    startPoint.x = event.x;
    startPoint.y = event.y;
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
  };

  const mousemove = (event: MouseEvent) => {
    if (!isDown.value) return;
    const x = event.x - startPoint.x;
    const y = event.y - startPoint.y;
    const moveX = Math.floor(point.x + x);
    if (moveX >= 0 && moveX < document.body.clientWidth - layout.width) {
      point.x = moveX;
    }
    const moveY = Math.floor(point.y + y);
    if (moveY >= 0 && moveY < document.body.clientHeight - layout.height) {
      point.y = moveY;
    }
    startPoint.x = event.x;
    startPoint.y = event.y;
  };

  const mouseup = () => {
    isDown.value = false;
    document.removeEventListener("mousemove", mousemove);
    document.removeEventListener("mouseup", mouseup);
  };

  const mouseenter = () => {
    window.store.dispatch(StoreEventEnum.ReserveShareCanvasMouse, "");
  };

  const mouseleave = () => {
    props.drawingTool === DrawingTool.Cursor &&
      window.store.dispatch(StoreEventEnum.IgnoreShareCanvasMouse, "");
  };

  onMounted(() => {
    container.value?.addEventListener("mousedown", mousedown);

    container.value?.addEventListener("mouseenter", mouseenter);

    container.value?.addEventListener("mouseleave", mouseleave);
  });

  onUnmounted(() => {
    container.value?.removeEventListener("mousedown", mousedown);

    container.value?.removeEventListener("mouseenter", mouseenter);

    container.value?.removeEventListener("mouseleave", mouseleave);
  });

  watchEffect(() => {
    if (point.y + layout.height > height.value - 2) {
      point.y = height.value - layout.height - 2;
    }
    if (point.x + layout.width > width.value - 2) {
      point.x = width.value - layout.width - 2;
    }
  });

  return {
    container,
    point,
  };
};
