<script setup lang="ts">
import { interactiveWhiteboardBus } from "@/screens/trtc-room/components/interactive-whiteboard/mitt";
import { reactive, watch } from "vue";

const drawing = reactive({
  lineSize: 9,
  lineColor: "#e62222",
});

const sizes = [3, 6, 9, 12, 15];

const colors = [
  "#000000",
  "#939699",
  "#e62222",
  "#fd6a0e",
  "#f7b500",
  "#14bf50",
  "#44d7b6",
  "#146fff",
  "#6236ff",
];

watch(
  () => drawing.lineColor,
  (val) => {
    interactiveWhiteboardBus.emit("lineColor", val);
  },
);

watch(
  () => drawing.lineSize,
  (val) => {
    interactiveWhiteboardBus.emit("lineSize", val);
  },
);
</script>

<template>
  <div class="brush-container">
    <div class="size-list">
      <div
        :class="['size-item', size === drawing.lineSize && 'active']"
        v-for="size in sizes"
        :key="size"
        @click="() => (drawing.lineSize = size)"
      >
        <div class="size" :style="`width: ${size}px`" />
      </div>
    </div>
    <div class="color-list">
      <div
        :class="['color-item', color === drawing.lineColor && 'active']"
        v-for="color in colors"
        :key="color"
        @click="() => (drawing.lineColor = color)"
      >
        <div class="color" :style="`background-color: ${color}`" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
