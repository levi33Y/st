<script setup lang="ts">
defineProps<{
  modelValue?: string;
}>();
</script>

<template>
  <el-tooltip effect="light" content="參會時長" placement="bottom">
    <div class="meeting-duration">{{ modelValue ?? "" }}</div>
  </el-tooltip>
</template>

<style scoped lang="scss">
.meeting-duration {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 20px;
  padding: 0 4px;
  font-size: var(--font-size-small);
  user-select: none;
}
</style>
