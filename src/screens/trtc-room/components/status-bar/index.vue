<script setup lang="ts">
import Network from "../network/index.vue";
import MeetingInfo from "./components/meeting-info/index.vue";

defineProps<{
  meetingNumber: string;
  moderatorName: string;
  title: string;
}>();

const emits = defineEmits<{
  (event: "update:ParticipateDuration", duration: string): void;
}>();
</script>

<template>
  <div class="status-bar">
    <div class="left">
      <slot name="left">
        <MeetingInfo
          :meetingNumber="meetingNumber"
          :moderatorName="moderatorName"
          :title="title"
        />
        <i class="iconfont icon-safe" />
        <Network />
      </slot>
    </div>
    <div class="center">
      <slot name="center" />
    </div>
    <div class="right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./index.scss";
</style>
