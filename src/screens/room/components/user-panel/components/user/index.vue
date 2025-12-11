<template>
  <div class="user-item-container">
    <div v-if="stream.cameraStream" class="user-item-video">
      <video
        id="myVideo"
        class="user-video"
        :srcObject="stream.cameraStream"
        autoplay
        playsInline
        muted
      />
      <div class="user-info">
        <span class="title">{{ stream?.nick }}</span>
        <Microphone
          :is-muted="stream?.isMuted"
          :size="15"
          :frequency="stream.frequency"
        />
      </div>
      <Transition name="speaking">
        <div v-show="stream.isSpeaking" class="user-item-active" />
      </Transition>
    </div>
    <div v-else class="user-item-content">
      <Avatar :size="72" :font-size="36" :name="stream?.nick" />
      <div class="user-info">
        <span class="title">{{ stream?.nick }}</span>
        <Microphone
          :is-muted="stream?.isMuted"
          :size="15"
          :frequency="stream.frequency"
        />
      </div>
      <Transition name="speaking">
        <div v-show="stream.isSpeaking" class="user-item-active" />
      </Transition>
    </div>
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
