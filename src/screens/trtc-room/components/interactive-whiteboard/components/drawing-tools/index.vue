<script setup lang="ts">
import { DrawingTool } from "@/entity/enum";
import { toRefs } from "vue";
import BrushStatus from "../brush-status/index.vue";
import { IProps, useAction } from "./hooks";

const props = defineProps<IProps>();

const { drawingTool, undoDisabled, redoDisabled } = toRefs(props);

const { container, point, onClick, onAction, onClose } = useAction(props);
</script>

<template>
  <div
    ref="container"
    class="drawing-tool"
    :style="`transform: translate(${point.x < 0 ? 0 : point.x}px, ${
      point.y < 0 ? 0 : point.y
    }px);`"
  >
    <div
      :class="['drawing-item', drawingTool === DrawingTool.Cursor && 'active']"
      @click="() => onClick(DrawingTool.Cursor)"
    >
      <i class="iconfont icon-cursor" />
      <p class="title">鼠标</p>
    </div>
    <el-popover
      placement="top"
      :width="312"
      :offset="16"
      trigger="hover"
      popper-style="padding: 0;"
    >
      <template #reference>
        <div
          :class="[
            'drawing-item',
            drawingTool === DrawingTool.Brush && 'active',
          ]"
          @click="() => onClick(DrawingTool.Brush)"
        >
          <i class="iconfont icon-brush" />
          <p class="title">画笔</p>
        </div>
      </template>
      <BrushStatus />
    </el-popover>
    <div
      :class="['drawing-item', drawingTool === DrawingTool.Eraser && 'active']"
      @click="() => onClick(DrawingTool.Eraser)"
    >
      <i class="iconfont icon-eraser" />
      <p class="title">橡皮擦</p>
    </div>
    <div class="divider" />
    <div
      :class="['drawing-item', undoDisabled && 'disabled']"
      @click="() => !undoDisabled && onAction(DrawingTool.Undo)"
    >
      <i class="iconfont icon-undo" />
      <p class="title">撤销</p>
    </div>
    <div
      :class="['drawing-item', redoDisabled && 'disabled']"
      @click="() => !redoDisabled && onAction(DrawingTool.Redo)"
    >
      <i class="iconfont icon-redo" />
      <p class="title">重做</p>
    </div>
    <div
      :class="['drawing-item', undoDisabled && 'disabled']"
      @click="() => !undoDisabled && onAction(DrawingTool.Clear)"
    >
      <i class="iconfont icon-delete" />
      <p class="title">清空</p>
    </div>
    <div class="close-btn" @click="onClose">
      <i class="iconfont icon-close" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
