<script setup lang="ts">
import { WhiteboardEventEnum } from "@/utils/trtc/hook/useMitt";
import { RoomEventEnum, roomService } from "@/utils/trtc/roomService";
import { Menu } from "@element-plus/icons-vue";
import DrawEdit from "@icon/draw-edit/index.vue";
import { onMounted, ref } from "vue";
import ActionBtn from "../action-btn/index.vue";

const drawDisable = ref(true);

const handleCommand = (command: string) => {
  switch (command) {
    case "draw": {
      roomService.emit(
        RoomEventEnum.WHITEBOARD_EVENT,
        WhiteboardEventEnum.ToggleDrawingTool,
      );

      break;
    }
    default: {
      break;
    }
  }
};

onMounted(() => {
  roomService.on(RoomEventEnum.WHITEBOARD_EVENT, (type) => {
    switch (type) {
      case WhiteboardEventEnum.WhiteboardReady: {
        drawDisable.value = false;

        break;
      }
      case WhiteboardEventEnum.WhiteboardError: {
        drawDisable.value = true;

        break;
      }
      default: {
        break;
      }
    }

    return;
  });
});
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
