<script setup lang="ts">
import InteractiveWhiteboard from "@components/interactive-whiteboard/index.vue";
import { useAction } from "./hook";

const { drawingBoardRef, meetingStore, tEduBoardEvent } = useAction();
</script>

<template>
  <div class="share-canvas">
    <interactive-whiteboard
      ref="drawingBoardRef"
      :is-master="true"
      @tEduBoardEvent="tEduBoardEvent"
      :user-info="{
        userSid: meetingStore.localParticipantId,
        meetingNumber: meetingStore.meetingNumber,
      }"
    />
    <audio ref="audioElement" style="display: none" />
  </div>
</template>

<style scoped lang="scss">
@use "./index";
</style>
