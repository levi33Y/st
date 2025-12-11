<script setup lang="ts">
import {
  TRTCScreenCaptureSourceInfo,
  TRTCScreenCaptureSourceType,
} from "trtc-electron-sdk";

interface Props {
  screenSources: TRTCScreenCaptureSourceInfo[];
}

defineProps<Props>();

const currentSource = defineModel({
  default: {} as TRTCScreenCaptureSourceInfo,
});

const onClick = (source: TRTCScreenCaptureSourceInfo) => {
  currentSource.value = source;
};

const convertBGRAToBase64 = (
  thumbnail: {
    buffer: ArrayBuffer;
    length: number;
    width: number;
    height: number;
  },
  imageFormat: string = "image/png",
  quality: number = 0.65,
): string | null => {
  if (
    !thumbnail ||
    !thumbnail.buffer ||
    !thumbnail.width ||
    !thumbnail.height
  ) {
    return null;
  }

  const { buffer, width, height } = thumbnail;

  // 创建Canvas元素
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("Failed to get canvas context");
    return null;
  }

  // 将ArrayBuffer转换为Uint8ClampedArray，并进行BGRA到RGBA的转换
  const bgraData = new Uint8ClampedArray(buffer);
  const rgbaData = new Uint8ClampedArray(width * height * 4);

  // BGRA转RGBA格式转换
  for (let i = 0; i < bgraData.length; i += 4) {
    rgbaData[i] = bgraData[i + 2]; // Red
    rgbaData[i + 1] = bgraData[i + 1]; // Green
    rgbaData[i + 2] = bgraData[i]; // Blue
    rgbaData[i + 3] = bgraData[i + 3]; // Alpha
  }

  // 创建ImageData对象并绘制到Canvas
  const imageData = new ImageData(rgbaData, width, height);
  ctx.putImageData(imageData, 0, 0);

  // 返回base64格式的Data URL
  return canvas.toDataURL(imageFormat, quality);
};
</script>

<template>
  <div v-for="source in screenSources" :key="source.sourceId">
    <el-tooltip effect="light" :content="source?.sourceName" placement="bottom">
      <div
        :class="[
          'screen',
          currentSource?.sourceId === source?.sourceId && 'active',
        ]"
        @click="onClick(source)"
      >
        <slot>
          <el-image
            style="width: 120px; height: 68px"
            :src="convertBGRAToBase64(source?.thumbBGRA)"
            fit="contain"
          />
        </slot>
        <p class="title">{{ source?.sourceName }}</p>

        <el-image
          v-if="
            source?.iconBGRA &&
            source.type !==
              TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeScreen
          "
          class="app-icon"
          :src="convertBGRAToBase64(source?.iconBGRA)"
          fit="contain"
        />
      </div>
    </el-tooltip>
  </div>
</template>

<style scoped lang="scss">
@use "./index";
</style>
