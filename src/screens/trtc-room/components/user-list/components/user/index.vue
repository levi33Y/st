<template>
  <div class="user-list-item">
    <video
      v-if="stream?.cameraStream"
      class="user-video"
      :srcObject="stream?.cameraStream"
      autoplay
      playsInline
      muted
    />
    <Avatar :size="40" :name="stream?.name" />
    <div class="user-box-footer">
      <div class="user-info">
        <div :class="['mic-mute-status', stream?.isMuted && 'disabled']">
          <Microphone :size="12" :frequency="frequency" color="#fff" />
        </div>
        <p class="nickname">{{ stream?.name }}</p>
      </div>
    </div>
    <Transition name="speaking">
      <div v-show="stream?.outputAudioLevel" class="user-item-active" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { IUserInfoProps } from "@/utils/trtc/store/room";
import { computed } from "vue";
import Avatar from "../../../../../../components/avatar/index.vue";
import Microphone from "../../../../../../components/microphone/index.vue";

interface Props {
  stream: IUserInfoProps;
}

const frequency = computed(() => {
  return stream.outputAudioLevel;
});

const { stream } = defineProps<Props>();
</script>

<style scoped lang="scss">
@use "./index";
</style>
