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

<script setup lang="ts">
import VideoCloseIcon from "@icon/video-close/index.vue";
import VideoIcon from "@icon/video/index.vue";
import { useDebounceFn } from "@vueuse/core";
import { onMounted, ref, toRefs } from "vue";
import { getMediaDeviceAccessAndStatus } from "../../../../utils/media";
import ActionBtn from "../action-btn/index.vue";

interface Props {
  isCameraEnabled: boolean;
  update?: () => Promise<void>;
}

const props = defineProps<Props>();

const { isCameraEnabled } = toRefs(props);

const loading = ref(false);

onMounted(async () => {
  getMediaDeviceAccessAndStatus("camera");
});

const onClick = useDebounceFn(async () => {
  try {
    loading.value = true;
    const pass = await getMediaDeviceAccessAndStatus("camera", true);
    if (pass) {
      await props?.update?.();
    }
  } finally {
    loading.value = false;
  }
}, 300);
</script>
