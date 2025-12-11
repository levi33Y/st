<template>
  <div class="microphone-container" :style="`--svs-size: ${size ?? 32}px;`">
    <el-icon :size="size">
      <svg
        v-if="!isMuted"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="icon/vvoice">
          <defs>
            <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                :offset="`${percentage}%`"
                :style="`stop-color: ${color ?? '#333'}`"
              />
              <stop
                offset="0%"
                :style="`stop-color: ${activeColor ?? '#34c759'}`"
              />
            </linearGradient>
          </defs>
          <path
            id="Union"
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M16 2.40442C18.578 2.40442 20.6673 4.26161 20.6673 6.55257V14.2563C20.6673 16.5472 18.578 18.4044 16 18.4044C13.4233 18.4044 11.334 16.5472 11.334 14.2563V6.55257C11.334 4.26161 13.4233 2.40442 16 2.40442Z"
            :fill="`url(#${gradientId})`"
          />
          <path
            id="Union"
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M9.15991 15.7194C9.02189 15.1846 8.47648 14.863 7.94173 15.0011C7.40697 15.1391 7.08535 15.6845 7.22338 16.2192C7.68498 18.0076 8.67752 19.5802 10.0207 20.7601C11.3806 21.9548 13.1031 22.7494 15.0007 22.9579V24.8626H11.3581C10.8058 24.8626 10.3581 25.3104 10.3581 25.8626C10.3581 26.4149 10.8058 26.8626 11.3581 26.8626H16.0007H20.7359C21.2882 26.8626 21.7359 26.4149 21.7359 25.8626C21.7359 25.3104 21.2882 24.8626 20.7359 24.8626H17.0007V22.958C20.7749 22.5438 23.8504 19.8129 24.778 16.2192C24.916 15.6845 24.5944 15.1391 24.0596 15.0011C23.5249 14.863 22.9795 15.1846 22.8414 15.7194C22.0555 18.7642 19.2893 21.0125 16.0007 21.0125C14.2144 21.0125 12.585 20.3507 11.3406 19.2575C10.2913 18.3357 9.51872 17.1095 9.15991 15.7194Z"
            :fill="color ?? '#333'"
          />
        </g>
      </svg>

      <mute-icon v-else />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import MuteIcon from "@icon/mute/index.vue";

import { onMounted, onUnmounted, ref, toRefs } from "vue";

interface Props {
  size: number;
  frequency: number;
  color?: string;
  activeColor?: string;
  isMuted?: boolean;
}

const props = defineProps<Props>();

const { size, color, activeColor, frequency } = toRefs(props);

const gradientId = ref(Math.random().toString(32).substring(2));

const frame = ref<number>(0);

const percentage = ref(0);

const getFrequency = () => {
  const value = 100 - (frequency.value / 150) * 100;
  percentage.value = value > 100 ? 0 : value;
  frame.value = requestAnimationFrame(getFrequency);
};

onMounted(getFrequency);

onUnmounted(() => cancelAnimationFrame(frame.value));
</script>

<style scoped lang="scss">
.microphone-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--svs-size);
  height: var(--svs-size);
  color: var(--color-text-grey);
}
</style>
