<template>
  <el-popover
    placement="bottom"
    :width="120"
    trigger="hover"
    :show-arrow="true"
  >
    <template #reference>
      <div :class="['network', isOnline && 'online']">
        <i class="iconfont icon-network" />
        <i v-if="!isOnline" class="iconfont icon-close" />
      </div>
    </template>
    <div class="network-container">
      <p class="online-status">
        {{ isOnline ? "網絡連接正常" : "網絡已斷開，正在重連" }}
      </p>
      <div class="network-item">
        <p class="network-label">延遲：</p>
        <p>{{ delay }}</p>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useNetwork } from "@vueuse/core";

const networkState = useNetwork();

const isOnline = computed(() => networkState.isOnline.value);

const delay = computed(() =>
  isOnline ? `${networkState.rtt.value} ms` : "未知",
);
</script>

<style scoped lang="scss">
@use "./index";
</style>
