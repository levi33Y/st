<template>
  <div
    :class="['box-item', { moderatorDisabled: moderatorDisabled }]"
    @click="onClick"
  >
    <div :class="['box-icon', { disabled }]" :style="iconColor">
      <slot>
        <i :class="['iconfont', icon]" />
      </slot>
    </div>
    <slot name="title">
      <p class="title">{{ title }}</p>
    </slot>
    <div v-if="badge" class="badge">{{ badge }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from "vue";

interface Props {
  title: string;
  icon: string;
  disabled?: boolean;
  moderatorDisabled?: boolean;
  count?: number;
  iconColor?: string;
}

interface Emits {
  (event: "click"): void;
}

const props = defineProps<Props>();

const { title, icon, disabled, count, moderatorDisabled } = toRefs(props);

const emits = defineEmits<Emits>();

const badge = computed(() =>
  count?.value ? (count.value > 99 ? "99+" : `${count.value}`) : "",
);

const onClick = () => emits("click");
</script>

<style scoped lang="scss">
@use "./index";
</style>
