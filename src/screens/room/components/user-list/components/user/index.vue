<template>
  <div class="user-list-item">
    <video
      v-if="stream.cameraStream"
      class="user-video"
      :srcObject="stream.cameraStream"
      autoplay
      playsInline
      muted
    />
    <Avatar :size="40" :name="stream.participant.name" />
    <div class="user-box-footer">
      <div class="user-info">
        <div :class="['mic-mute-status', stream.isMuted && 'disabled']">
          <Microphone :size="12" :frequency="frequency" color="#fff" />
        </div>
        <p class="nickname">{{ stream.participant.name }}</p>
      </div>
    </div>
    <Transition name="speaking">
      <div v-show="stream.isSpeaking" class="user-item-active" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import Avatar from "../../../../../../components/avatar/index.vue";
import Microphone from "../../../../../../components/microphone/index.vue";
import { useGetFrequencyByParticipantStream } from "../../../../../../hooks/useGetFrequencyByParticipantStream";
import { ParticipantStream } from "../../../../../../utils/livekit/ParticipantStream";

interface Props {
  stream: ParticipantStream;
}

const { stream } = defineProps<Props>();

const { frequency } = useGetFrequencyByParticipantStream(stream);
</script>

<style scoped lang="scss">
@use "./index";
</style>
