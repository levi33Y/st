<script setup lang="ts">
import Secure from "@/icon/secure/index.vue";
import ActionBtn from "@/screens/room/components/action-btn/index.vue";
import { SecurityMenuSubscribeEnum } from "@/screens/room/props";

const props = defineProps<{
  lockChecked?: boolean;
}>();

const emits = defineEmits<{
  (event: "command", value: SecurityMenuSubscribeEnum): void;
}>();

const handleCommand = (command: SecurityMenuSubscribeEnum) => {
  emits("command", command);
};
</script>

<template>
  <el-dropdown placement="top" @command="handleCommand" trigger="click">
    <ActionBtn style="outline: unset" title="安全" icon="">
      <el-icon :size="32">
        <el-icon :size="25"><secure /></el-icon>
      </el-icon>
    </ActionBtn>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item :command="SecurityMenuSubscribeEnum.Lock">
          <div
            style="
              width: 100%;
              height: 100%;
              padding: 0 8px;
              display: flex;
              align-items: center;
            "
            v-checked="lockChecked"
          >
            鎖定會議
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item) {
  width: 160px;
  height: 32px;
  padding: 0;
  margin: 0 6px;
}
</style>
