<template>
  <div class="user-item-container">
    <div v-if="stream?.cameraStream" class="user-item-video">
      <video
        id="myVideo"
        class="user-video"
        :srcObject="stream?.cameraStream"
        autoplay
        playsInline
        muted
      />
      <div class="user-info">
        <span class="title">{{ stream?.nick }}</span>
        <Microphone
          :is-muted="stream?.isMuted"
          :size="15"
          :frequency="frequency"
        />
      </div>
      <Transition name="speaking">
        <div v-show="stream?.outputAudioLevel" class="user-item-active" />
      </Transition>
    </div>
    <div v-else class="user-item-content">
      <Avatar
        :size="72"
        :font-size="36"
        :name="stream?.nick"
        :src="stream.avatarUrl"
      />
      <div class="user-info">
        <span class="title">{{ stream?.nick }}</span>
        <Microphone
          :is-muted="stream?.isMuted"
          :size="15"
          :frequency="frequency"
        />
      </div>
      <Transition name="speaking">
        <div v-show="stream.outputAudioLevel" class="user-item-active" />
      </Transition>
    </div>
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

const { stream } = defineProps<Props>();

const frequency = computed(() => {
  return stream.outputAudioLevel;
});
</script>

<style scoped lang="scss">
@use "./index";
</style>
