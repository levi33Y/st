<template>
  <div class="speaking">
    <div class="text">正在講話：</div>
    <TransitionGroup name="speaking">
      <div
        class="text active"
        v-for="speaker in roomService.roomStore.speakList"
        :key="speaker"
      >
        {{ ` ${speaker} ` }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { roomService } from "@/utils/trtc/roomService";
</script>

<style scoped lang="scss">
@use "./index";
</style>
