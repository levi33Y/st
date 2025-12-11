<script setup lang="ts">
import InteractiveWhiteboard from "@/screens/trtc-room/components/interactive-whiteboard/index.vue";
import { useAction } from "./hook";

const {
  drawingBoardRef,
  meetingQuery,
  tEduBoardEvent,
  whiteboardError,
  WhiteboardReady,
  whiteboardHistoryData,
} = useAction();
</script>

<template>
  <div class="share-canvas">
    <interactive-whiteboard
      ref="drawingBoardRef"
      :is-master="true"
      :user-info="{
        userSid: meetingQuery.userSid,
        meetingNumber: meetingQuery.meetingNumber,
      }"
      @tEduBoardEvent="tEduBoardEvent"
      @whiteboard-error="whiteboardError"
      @whiteboard-ready="WhiteboardReady"
      @whiteboard-history-data="whiteboardHistoryData"
    />
  </div>
</template>

<style scoped lang="scss">
.share-canvas {
  width: 100vw;
  height: 100vh;
  position: relative;
}
</style>
