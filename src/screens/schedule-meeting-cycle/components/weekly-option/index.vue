<script setup lang="ts">
import { WeeklyOptionConst, WeeklyOptionEnum } from "../../props";

const model = defineModel<WeeklyOptionEnum[]>({ default: [] });

const update = (val: WeeklyOptionEnum) => {
  const exists = model.value.includes(val);

  model.value = exists
    ? model.value.filter((v) => v !== val)
    : [...model.value, val];
};
</script>

<template>
  <div class="weekly-list">
    <div
      v-for="item in WeeklyOptionConst"
      :key="item.value"
      @click="update(item.value)"
      :class="[
        'weekly-item',
        { 'activity-item': model?.some((i) => i === item.value) },
      ]"
    >
      {{ item.label }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.weekly-list {
  height: 28px;
  display: flex;
  column-gap: var(--spacing-smaller);

  .weekly-item {
    width: 47.43px;
    border-radius: 2px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 var(--spacing-smaller);
    border: var(--border-width-base) solid var(--border-color-base);
    cursor: pointer;
  }
}

.activity-item {
  background-color: #515bea;
  color: #fff;
}
</style>
