<script setup lang="ts">
import { roomService } from "@/utils/trtc/roomService";
import VideoCloseIcon from "@icon/video-close/index.vue";
import VideoIcon from "@icon/video/index.vue";
import { useDebounceFn } from "@vueuse/core";
import { isNil } from "lodash";
import { computed, onMounted, ref } from "vue";
import { getMediaDeviceAccessAndStatus } from "../../../../utils/media";
import ActionBtn from "../action-btn/index.vue";

const isCameraEnabled = computed(() => {
  return !isNil(roomService.roomStore?.localUser?.cameraStream);
});

const loading = ref(false);

const onClick = useDebounceFn(async () => {
  try {
    loading.value = true;

    if (isCameraEnabled.value) {
      roomService.mediaManager.setCameraEnabled(false);
    } else {
      roomService.mediaManager.setCameraEnabled(true);
    }
  } finally {
    loading.value = false;
  }
}, 300);

onMounted(async () => {
  getMediaDeviceAccessAndStatus("camera");
});
</script>

<template>
  <ActionBtn
    v-loading="loading"
    :title="isCameraEnabled ? '關閉視頻' : '開啟視頻'"
    icon="icon-video"
    @click="onClick"
  >
    <el-icon size="32">
      <video-icon v-if="isCameraEnabled" />
      <video-close-icon v-else />
    </el-icon>
  </ActionBtn>
</template>
