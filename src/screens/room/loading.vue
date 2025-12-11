<script setup lang="ts">
import { StoreEventEnum } from "@/entity/enum";
import { useReloading } from "../../hooks/useReload";
import Index from "./index.vue";

const { isLoading, reloadToggle } = useReloading();

window.store.dispatch(StoreEventEnum.RoomPageReady, "");
</script>

<template>
  <div class="container">
    <index v-if="!isLoading" @reloadToggle="reloadToggle" />
  </div>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
