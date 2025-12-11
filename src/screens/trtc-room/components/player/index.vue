<script setup lang="ts">
import UserList from "@/screens/trtc-room/components/user-list/index.vue";
import InteractiveWhiteboard from "@/screens/trtc-room/components/interactive-whiteboard/index.vue";
import { isNil } from "lodash";
import { useAction } from "./hooks";

const {
  videoRef,
  drawingBoardRef,
  stream,
  tEduBoardEvent,
  user,
  meeting,
  isSharingScreen,
  whiteboardError,
  WhiteboardReady,
} = useAction();
</script>

<template>
  <div class="player" v-if="!isNil(stream) && !isSharingScreen">
    <video
      ref="videoRef"
      id="stream-media"
      :srcObject="stream"
      autoplay
      playsInline
    />
    <interactive-whiteboard
      ref="drawingBoardRef"
      :is-master="false"
      @tEduBoardEvent="tEduBoardEvent"
      :user-info="{
        userSid: user.sid,
        meetingNumber: meeting.meetingNumber,
      }"
      @whiteboard-error="whiteboardError"
      @whiteboard-ready="WhiteboardReady"
    />
  </div>

  <UserList v-if="!isNil(stream)" />
</template>

<style scoped lang="scss">
@use "./index";
</style>
