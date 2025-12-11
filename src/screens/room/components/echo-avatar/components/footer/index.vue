<template>
  <div class="echo-avatar-footer">
    <el-button
      class="speaking-btn"
      type="primary"
      :loading="loading"
      @click="onSpeaking"
    >
      {{ isSpeaking ? "停止說話" : "開始說話" }}
    </el-button>
    <p v-show="isSpeaking" class="countdown">{{ countdown }}“</p>
  </div>
</template>

<script setup lang="ts">
import { getMediaDeviceAccessAndStatus } from "../../../../../../utils/media";
import { ref, toRefs } from "vue";

interface Props {
  isSpeaking: boolean;
  countdown: number;
  click?: () => Promise<void>;
}

const props = defineProps<Props>();

const { isSpeaking, countdown } = toRefs(props);

const loading = ref(false);

const onSpeaking = async () => {
  loading.value = true;
  const pass = await getMediaDeviceAccessAndStatus("microphone", true);
  if (!pass) {
    loading.value = false;
    return;
  }
  await props.click?.();
  loading.value = false;
};
</script>

<style scoped lang="scss">
@use "./index";
</style>
