<script setup lang="ts">
import DrawingTools from "./components/drawing-tools/index.vue";
import LaserPoint from "./components/laser-point/index.vue";
import { Emits, Props, useAction } from "./hooks";

const props = defineProps<Props>();

const emits = defineEmits<Emits>();

const {
  drawingToolsRef,
  container,
  canvasEl,
  drawingToolEnum,
  state,
  points,
  isModerator,
  historyDrawingRecords,
  undoDrawingRecords,
  appStore,
  onChange,
  onAction,
  remoteDrawing,
  resize,
  toggleDrawingTool,
  closeDrawingTool,
} = useAction(emits, props);

defineExpose({
  drawing: remoteDrawing,
  resize,
  historyDrawingRecords: historyDrawingRecords.value,
  toggleDrawingTool: toggleDrawingTool,
});
</script>

<template>
  <div ref="container" class="drawing-board">
    <canvas ref="canvasEl" id="canvas" />
  </div>

  <LaserPoint v-if="state.drawingTool === drawingToolEnum.Laser" />

  <Teleport to="body">
    <drawing-tools
      ref="drawingToolsRef"
      v-show="state.isShowDrawingTool"
      :drawing-tool="state.drawingTool"
      :undo-disabled="
        isModerator
          ? historyDrawingRecords.length === 0
          : historyDrawingRecords.filter(
              (item) => item.userId === appStore.userInfo.id,
            ).length === 0
      "
      :redo-disabled="
        isModerator
          ? undoDrawingRecords.length === 0
          : undoDrawingRecords.filter(
              (item) => item.userId === appStore.userInfo.id,
            ).length === 0
      "
      @change="onChange"
      @action="onAction"
      @close="closeDrawingTool"
    />
  </Teleport>
</template>

<style scoped lang="scss">
@use "./index";
</style>
