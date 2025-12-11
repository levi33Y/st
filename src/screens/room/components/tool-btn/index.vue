<script setup lang="ts">
import { Menu } from "@element-plus/icons-vue";
import DrawEdit from "@icon/draw-edit/index.vue";
import ActionBtn from "../action-btn/index.vue";

const props = defineProps<{
  drawDisable?: boolean;
}>();

const emits = defineEmits<{
  (event: "command", value: string): void;
}>();

const handleCommand = (command: string) => {
  emits("command", command);
};
</script>

<template>
  <el-dropdown placement="top" @command="handleCommand">
    <ActionBtn style="outline: unset" title="功能" icon="">
      <el-icon :size="32"><Menu /></el-icon>
    </ActionBtn>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="draw" :disabled="drawDisable">
          <el-icon :size="20" :color="drawDisable ? '#c1c4cc' : 'inherit'">
            <draw-edit />
          </el-icon>
          互動編輯
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss"></style>
