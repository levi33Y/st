<script setup lang="ts">
const model = defineModel<number[]>({ default: [] });

const update = (val: number) => {
  const exists = model.value.includes(val);

  model.value = exists
    ? model.value.filter((v) => v !== val)
    : [...model.value, val];
};
</script>

<template>
  <div class="monthly-container">
    <div class="monthly-list">
      <div
        v-for="item in Array.from({ length: 31 }, (_, index) => index + 1)"
        :key="item"
        @click="update(item)"
        :class="[
          'monthly-item',
          { 'activity-item': model?.some((i) => i === item) },
        ]"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.monthly-container {
  height: 168px;

  .monthly-list {
    width: 380px;
    display: flex;
    flex-wrap: wrap;
    row-gap: var(--spacing-smaller);
    justify-content: start;
    column-gap: var(--spacing-smaller);

    .monthly-item {
      height: 28px;
      width: 47.43px;
      border-radius: 2px;
      display: flex;
      justify-content: center;
      align-items: center;
      border: var(--border-width-base) solid var(--border-color-base);
      cursor: pointer;
    }
  }
}

.activity-item {
  background-color: #515bea;
  color: #fff;
}
</style>
