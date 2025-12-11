<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import Microphone from "../../../../components/microphone/index.vue";
import { getMediaDeviceAccessAndStatus } from "@/utils/media";
import ActionBtn from "../action-btn/index.vue";
import { ElMessage } from "element-plus";

const modelValue = defineModel({ default: true });

const loading = ref(false);

const frequency = ref(0);

const mediaStream = ref<MediaStream | null>();

const audioElement = ref<HTMLAudioElement>();

const setupMicrophone = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaStream.value = stream;

    if (!audioElement.value) return;

    audioElement.value.srcObject = stream;

    await audioElement.value.play();
  } catch {
    ElMessage.error("无法访问麦克风");
  }
};

const stopMicrophone = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => track.stop());

    mediaStream.value = null;
  }

  if (audioElement.value) {
    audioElement.value.pause();

    audioElement.value.srcObject = null;
  }
};

const onClick = async () => {
  try {
    loading.value = true;

    if (modelValue.value) {
      const pass = await getMediaDeviceAccessAndStatus("microphone", true);

      if (!pass) return;

      await setupMicrophone();

      modelValue.value = false;
    } else {
      stopMicrophone();

      modelValue.value = true;
    }
  } finally {
    loading.value = false;
  }
};

watch(modelValue, () => {
  if (modelValue.value || !mediaStream.value) return;

  const context = new AudioContext();
  const source = context.createMediaStreamSource(mediaStream.value);
  const analyser = context.createAnalyser();

  source.connect(analyser);
  analyser.fftSize = 256;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const draw = () => {
    if (modelValue.value) {
      context.close();
      return;
    }

    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    frequency.value = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
  };

  draw();
});

onUnmounted(() => {
  stopMicrophone();
});
</script>

<template>
  <ActionBtn title="" icon="icon-mic" @click="onClick">
    <div class="media">
      <div class="media-icon">
        <Microphone
          color="var(--color-text-regular)"
          :size="32"
          :frequency="frequency"
          :isMuted="modelValue"
        />
      </div>
      <div class="media-label">{{ modelValue ? "取消靜音" : "靜音" }}</div>
    </div>
  </ActionBtn>

  <!--  <audio ref="audioElement" style="display: none" autoplay/>-->
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
