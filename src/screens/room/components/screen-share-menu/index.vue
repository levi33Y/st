<script setup lang="ts">
import { useAction } from "./hooks";

const visibleModel = defineModel({ default: false });

const { tipRef, menuRef, handleEndShare, showDetail, loading, pause, resume } =
  useAction(visibleModel);

defineExpose({
  keepExpanding: pause,
  autoShrink: resume,
});
</script>

<template>
  <div v-show="visibleModel && !loading" class="container">
    <div v-show="!showDetail" ref="tipRef" class="page-model tip">
      <div style="pointer-events: none">
        <slot name="tip" />
      </div>
    </div>

    <div v-show="showDetail" class="page-model menu">
      <slot name="menu" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./index";
</style>
