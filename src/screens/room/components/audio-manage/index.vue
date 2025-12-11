<template>
  <ActionBtn
    v-loading="loading"
    :title="isMuted ? '取消靜音' : '靜音'"
    icon="icon-mic"
    :moderatorDisabled="appStore.isEASpeaking"
    @click="onClick"
  >
    <Microphone
      color="var(--color-text-regular)"
      :size="32"
      :frequency="localStream?.frequency ?? 100"
      :isMuted="isMuted"
    />
  </ActionBtn>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRefs } from "vue";
import Microphone from "../../../../components/microphone/index.vue";
import { useAppStore } from "../../../../stores/useAppStore";
import { ParticipantStream } from "../../../../utils/livekit/ParticipantStream";
import { getMediaDeviceAccessAndStatus } from "../../../../utils/media";
import ActionBtn from "../action-btn/index.vue";

interface Props {
  localStream: ParticipantStream | undefined;
  update: (status: boolean) => Promise<void>;
}

const props = defineProps<Props>();

const appStore = useAppStore();

const { localStream } = toRefs(props);

const loading = ref(false);

const frequency = ref(0);

const isUnmounted = ref(false);

const isMuted = computed(() => localStream.value?.isMuted ?? true);

const init = () => {
  if (isUnmounted.value) return;
  frequency.value = localStream.value?.frequency ?? 0;
  requestAnimationFrame(init);
};

onMounted(async () => {
  getMediaDeviceAccessAndStatus("microphone");
  init();
});

onUnmounted(() => (isUnmounted.value = true));

const onClick = async () => {
  try {
    loading.value = true;
    if (isMuted.value) {
      const pass = await getMediaDeviceAccessAndStatus("microphone", true);
      if (!pass) return;
    }

    await props?.update(!isMuted.value);
  } finally {
    loading.value = false;
  }
};
</script>
