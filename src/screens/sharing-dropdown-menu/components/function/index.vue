<script setup lang="ts">
import { StoreEventEnum, useNavigation } from "@/hooks/useNavigation";
import DrawEdit from "@/icon/draw-edit/index.vue";
import { MoreFunctionEnum } from "@/screens/trtc-room/props";
import { useDebounceFn } from "@vueuse/core";
import { onMounted, ref } from "vue";

const navigation = useNavigation();

const drawDisable = ref(true);

const onSendCommand = useDebounceFn(async (command: MoreFunctionEnum) => {
  switch (command) {
    case MoreFunctionEnum.InteractiveEditing: {
      navigation.emit(StoreEventEnum.WhiteboardToggleTool);
      break;
    }
    default: {
      break;
    }
  }
}, 300);

onMounted(() => {
  navigation.on(StoreEventEnum.WhiteboardReady, () => {
    drawDisable.value = false;
  });

  navigation.on(StoreEventEnum.WhiteboardError, () => {
    drawDisable.value = true;
  });
});
</script>

<template>
  <div class="container">
    <div
      class="menu-item"
      @click="onSendCommand(MoreFunctionEnum.InteractiveEditing)"
      :class="[drawDisable ? 'drawDisable' : 'enable']"
    >
      <el-icon :size="20">
        <draw-edit />
      </el-icon>
      互動編輯
    </div>
  </div>
</template>

<style scoped lang="scss">
.drawDisable {
  color: #c1c4cc;
  cursor: not-allowed;
}

.enable {
  cursor: pointer;

  &:hover {
    background-color: #eef0ff;
    color: #475aec;
  }
}

.container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  font-size: 14px;
  padding: 6px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  row-gap: 2px;

  .menu-item {
    width: 100%;
    height: 32px;
    padding: 5px 18px;
    display: flex;
    column-gap: 12px;
    align-items: center;
    justify-content: start;
  }
}
</style>
