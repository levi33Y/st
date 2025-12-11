<!--Common Components-->
<script setup lang="ts">
import DrawingTools from "./components/drawing-tools/index.vue";
import { useAction } from "./hooks";

import { interactiveWhiteboardBus } from "@/screens/trtc-room/components/interactive-whiteboard/mitt";
import { IEmitsProps, IProps } from "./hooks";

const props = defineProps<IProps>();

const emits = defineEmits<IEmitsProps>();

const {
  drawingToolsRef,
  container,
  drawingToolEnum,
  state,
  isReady,
  onChange,
  onAction,
  remoteDrawing,
  toggleDrawingTool,
  closeDrawingTool,
  resize,
  reset,
  addAckData,
  syncAndReload,
  isHistoryCompleted,
} = useAction(emits, props);

defineExpose({
  resize: resize,
  syncData: remoteDrawing,
  reset: reset,
  onAction: onAction,
  addAckData: addAckData,
  syncAndReload: syncAndReload,
  toggleDrawingTool: toggleDrawingTool,
  closeDrawingTool: closeDrawingTool,
  bus: interactiveWhiteboardBus,
});
</script>

<template>
  <div class="drawing-board">
    <div
      ref="container"
      v-show="isReady && isHistoryCompleted"
      class="drawing-container"
      id="whiteboard-container"
    />
  </div>

  <Teleport to="body">
    <drawing-tools
      ref="drawingToolsRef"
      v-show="state.isShowDrawingTool"
      :drawing-tool="state.drawingTool"
      :undo-disabled="false"
      :redo-disabled="false"
    />
  </Teleport>
</template>

<style scoped lang="scss">
@use "index";
</style>
