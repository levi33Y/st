<template>
  <div class="container">
    <div class="container-title">
      <div class="title">
        <span class="left">紀錄編號:</span>
        <span class="right">{{ data.recordNumber }}</span>
      </div>
      <div class="title">
        <span class="left">會議主題:</span>
        <span class="right">{{ data.title }}</span>
      </div>
      <div class="title">
        <span class="left">會議號:</span>
        <span class="right">{{ data.meetingNumber }}</span>
      </div>
      <div class="title">
        <span class="left">開始時間:</span>
        <span class="right">{{ data.startDate }}</span>
      </div>
      <div class="title">
        <span class="left">結束時間:</span>
        <span class="right">{{ data.endDate }}</span>
      </div>
    </div>
    <div class="video-preview">
      <video class="video-container" :src="videoUrl" controls></video>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, toRefs } from "vue";
interface Props {
  data: {
    recordNumber: string;
    title: string;
    meetingNumber: string;
    startDate: string;
    endDate: string;
    videoUrl: string;
  };
  videoUrl: string;
}

const props = defineProps<Props>();
const { data, videoUrl } = toRefs(props);
</script>
<style lang="scss" scoped>
@use "./index";
</style>
