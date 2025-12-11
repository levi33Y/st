<script setup lang="ts">
import { useAction } from "./hook";
import { TabsEnum } from "./props";

const tabValue = defineModel<TabsEnum | null>({ default: null });

const { editableTabs, onTabsRemove, onTabsOpen, handleUpdateTabsTitle } =
  useAction(tabValue);

defineExpose({
  onOpenTab: onTabsOpen,
  onUpdateTab: handleUpdateTabsTitle,
});
</script>

<template>
  <el-tabs
    v-show="editableTabs.length > 0"
    v-model="tabValue"
    closable
    @edit="onTabsRemove"
    class="tabs-container"
  >
    <el-tab-pane
      v-for="item in editableTabs"
      :key="item.name"
      :label="item.title"
      :name="item.name"
    >
      <slot />
    </el-tab-pane>
  </el-tabs>
</template>

<style scoped lang="scss">
@use "./index.scss";
</style>
