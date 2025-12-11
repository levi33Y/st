<script setup lang="ts">
import { watchImmediate } from "@vueuse/core";
import { ref, watch } from "vue";
import { useSettingsStore } from "../../../../stores/useSettingsStore";
import { ParticipantStream } from "../../../../utils/livekit/ParticipantStream";

const settingsStore = useSettingsStore();

defineProps<{
  streamList: ParticipantStream[];
}>();

const audioElementRefs = ref<HTMLAudioElement[]>([]);

watch(
  () => audioElementRefs.value.length,
  () => {
    audioElementRefs.value?.forEach((item) => {
      item?.setSinkId(settingsStore.audioOutputDeviceId);
    });
  },
);

watchImmediate(
  () => settingsStore.audioOutputDeviceId,
  (deviceId) => {
    audioElementRefs.value?.forEach((item) => {
      item?.setSinkId(deviceId);
    });
  },
);
</script>

<template>
  <div v-for="stream in streamList" :key="stream.id">
    <audio
      ref="audioElementRefs"
      style="display: none"
      v-if="!stream.isLocal"
      :srcObject="stream.microphoneStream"
      autoplay
    />
  </div>
</template>
