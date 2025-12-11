<script setup lang="ts">
import RecordingIcon from "@icon/recording/index.vue";
import ActionBtn from "../action-btn/index.vue";
import { useAction } from "./hooks";

const {
  isRecording,
  meeting,
  isHost,
  onClick,
  loading,
  updateRecord,
  recordSpeak,
  stopRecord,
  startRecord,
} = useAction();

defineExpose({
  startRecord,
  stopRecord,
  updateRecord,
  recordSpeak,
});
</script>

<template>
  <ActionBtn
    v-loading="loading"
    :title="isRecording ? '關閉錄製' : '錄製'"
    :iconColor="isRecording ? 'color:#F3333E' : 'color:#5b5b6c'"
    :moderator-disabled="!isHost"
    icon="icon-record"
    @click="onClick"
  >
    <el-icon size="32" :color="`${isRecording ? 'red' : '#5A5B6D'}`">
      <Recording-icon />
    </el-icon>
  </ActionBtn>
</template>
