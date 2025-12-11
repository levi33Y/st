<script setup lang="ts">
import { ScreenSource } from "../../../../entity/types";

interface Props {
  source: ScreenSource;
  active?: boolean;
}

interface Emits {
  (event: "click", source?: ScreenSource): void;
}

defineProps<Props>();

const emits = defineEmits<Emits>();

const onClick = (source: ScreenSource) => emits("click", source);
</script>

<template>
  <el-tooltip effect="light" :content="source?.name" placement="bottom">
    <div :class="['screen', active && 'active']" @click="onClick(source)">
      <slot>
        <el-image
          style="width: 120px; height: 68px"
          :src="source?.thumbnail"
          fit="contain"
        />
      </slot>
      <p class="title">{{ source?.name }}</p>

      <el-image
        v-if="source?.appIcon"
        class="app-icon"
        :src="source?.appIcon"
        fit="contain"
      />
    </div>
  </el-tooltip>
</template>

<style scoped lang="scss">
@use "./index";
</style>
