<script setup lang="ts">
import Microphone from "@components/microphone/index.vue";
import { ref, watch } from "vue";
import { useGetFrequencyByParticipantStream } from "../../hooks/useGetFrequencyByParticipantStream";
import { ParticipantStream } from "../../utils/livekit/ParticipantStream";

const props = defineProps({
  stream: {
    type: ParticipantStream,
    required: true,
  },
});

const frequency = useGetFrequencyByParticipantStream(props.stream);

const visible = ref(true);

defineExpose({
  onShow: (val: boolean) => {
    visible.value = val;
  },
});

watch(
  () => props?.stream?.frequency,
  (val) => {
    val > 50 && console.log(val);
  },
);
</script>

<template>
  <div
    v-show="visible"
    :class="['member-list-microphone', stream.isMuted && 'disabled']"
  >
    <Microphone :size="16" :frequency="stream.frequency" />
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
