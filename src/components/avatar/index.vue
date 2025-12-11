<script setup lang="ts">
interface Props {
  size: number;
  src?: string;
  name?: string;
  cursor?: string;
  fit?: "fill" | "contain" | "cover" | "none" | "scale-down";
  fontSize?: number;
}

withDefaults(defineProps<Props>(), {
  fit: "cover",
  fontSize: 20,
});
</script>

<template>
  <div
    class="avatar-container"
    :style="`--avatar-size: ${size}px;--avatar-cursor: ${cursor};--avatar-fit: ${fit};--avatar-font-size: ${fontSize}px;`"
  >
    <img v-if="src" class="avatar-img" :src="src" />
    <p v-else-if="name?.at(0)" class="avatar-nickname">
      {{ name.at(0) ?? "" }}
    </p>
    <i v-else class="iconfont icon-avatar" />
  </div>
</template>

<style scoped lang="scss">
@use "./index";
</style>
