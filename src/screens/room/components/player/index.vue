<template>
  <div class="player">
    <video
      ref="videoRef"
      id="stream-media"
      :srcObject="stream"
      autoplay
      playsInline
    />
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, toRefs, watch } from "vue";
import { Emits, useAction } from "./hooks";
import { watchImmediate } from "@vueuse/core";
import { useSettingsStore } from "../../../../stores/useSettingsStore";

interface Props {
  stream: MediaStream;
}

const props = defineProps<Props>();

const emits = defineEmits<Emits>();

const { stream } = toRefs(props);

const { videoRef } = useAction(emits);
</script>

<style scoped lang="scss">
@use "./index";
</style>
