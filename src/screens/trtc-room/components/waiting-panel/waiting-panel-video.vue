<script setup lang="ts">
import VideoCloseIcon from "@icon/video-close/index.vue";
import VideoIcon from "@icon/video/index.vue";
import { useDebounceFn } from "@vueuse/core";
import { onUnmounted, ref } from "vue";
import { getMediaDeviceAccessAndStatus } from "@/utils/media";
import ActionBtn from "../action-btn/index.vue";
import { ElMessage } from "element-plus";

const modelValue = defineModel({ default: false });

const loading = ref(false);

const mediaStream = ref<MediaStream | null>();

const videoElement = ref<HTMLVideoElement | null>(null);

const setupCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    mediaStream.value = stream;

    if (videoElement.value) {
      videoElement.value.srcObject = stream;
      await videoElement.value.play();
    }
  } catch (err) {
    ElMessage.error("无法访问摄像头");
  }
};

const stopCamera = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => track.stop());
    mediaStream.value = null;
  }

  if (videoElement.value) {
    videoElement.value.pause();
    videoElement.value.srcObject = null;
  }
};

const onClick = useDebounceFn(async () => {
  try {
    loading.value = true;

    const pass = await getMediaDeviceAccessAndStatus("camera", true);

    if (!pass) {
      return;
    }

    if (!modelValue.value) {
      await setupCamera();

      modelValue.value = true;
    } else {
      stopCamera();

      modelValue.value = false;
    }
  } finally {
    loading.value = false;
  }
}, 300);

onUnmounted(() => {
  stopCamera();
});
</script>

<template>
  <ActionBtn title="" icon="icon-video" @click="onClick">
    <div class="media">
      <div class="media-icon">
        <el-icon size="32">
          <video-icon v-if="modelValue" />
          <video-close-icon v-else />
        </el-icon>
      </div>
      <div class="media-label">
        {{ modelValue ? "關閉視頻" : "開啟視頻" }}
      </div>
    </div>
  </ActionBtn>

  <!--  <video-->
  <!--      ref="videoElement"    style="display: none"-->
  <!--      autoplay-->
  <!--      muted-->
  <!--      playsinline-->
  <!--  ></video>-->
</template>

<style lang="scss" scoped>
.media {
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 10px;

  .media-icon {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 36px 36px 36px 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .media-label {
    font-size: 10px;
    color: white;
  }
}
</style>
