<script setup lang="ts">
interface Props {
  appIcons: Base64URLString[];
  currentAppIcon: string;
}

interface Emits {
  (event: "click", appIcon: string): void;
}

defineProps<Props>();

const emits = defineEmits<Emits>();

const onClick = (appIcon: string) => emits("click", appIcon);
</script>

<template>
  <div class="screen-share-tabs">
    <div
      :class="['tab-item', currentAppIcon === '' && 'active']"
      @click="() => onClick('')"
    >
      <p class="tab-all">全部</p>
    </div>
    <div
      v-for="appIcon in appIcons"
      :key="appIcon"
      :class="['tab-item', currentAppIcon === appIcon && 'active']"
      @click="() => onClick(appIcon)"
    >
      <img class="app-logo" :src="appIcon" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./index";
</style>
