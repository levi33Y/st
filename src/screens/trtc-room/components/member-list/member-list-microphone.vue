<script setup lang="ts">
import { IUserInfoProps } from "@/utils/trtc/store/room";
import Microphone from "@components/microphone/index.vue";
import { computed, ref } from "vue";

const props = defineProps<{
  stream: IUserInfoProps;
}>();

const frequency = computed(() => props.stream.outputAudioLevel);

const visible = ref(true);

defineExpose({
  onShow: (val: boolean) => {
    visible.value = val;
  },
});
</script>

<template>
  <div
    v-show="visible"
    :class="['member-list-microphone', stream.isMuted && 'disabled']"
  >
    <Microphone :size="16" :frequency="frequency" />
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
