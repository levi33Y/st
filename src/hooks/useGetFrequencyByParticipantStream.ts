import { onMounted, onUnmounted, ref } from "vue";
import { ParticipantStream } from "../utils/livekit/ParticipantStream";

export const useGetFrequencyByParticipantStream = (
  stream: ParticipantStream,
) => {
  const frequency = ref(0);

  const frame = ref<number>(0);

  const isUnmounted = ref(false);

  const getByteFrequencyData = () => {
    if (isUnmounted.value) return;
    frequency.value = stream.frequency;
    frame.value = requestAnimationFrame(getByteFrequencyData);
  };

  onMounted(getByteFrequencyData);

  onUnmounted(() => {
    isUnmounted.value = true;
    cancelAnimationFrame(frame.value);
  });

  return {
    frequency,
  };
};
