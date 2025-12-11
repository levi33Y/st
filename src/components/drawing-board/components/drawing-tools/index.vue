<script setup lang="ts">
import { DrawingTool } from "@/entity/enum";
import { toRefs } from "vue";
import BrushStatus from "../brush-status/index.vue";
import { Emits, IProps, useDragg } from "./hooks";

/*const drawingToolList = [
  {
    title: "鼠标",
    value: DrawingTool.Cursor,
    icon: "icon-cursor",
  },
  {
    title: "选择",
    value: DrawingTool.Move,
    icon: "icon-move",
  },
  {
    title: "激光笔",
    value: DrawingTool.Laser,
    icon: "icon-laser",
  },
  {
    title: "画笔",
    value: DrawingTool.Brush,
    icon: "icon-brush",
  },
  {
    title: "文本",
    value: DrawingTool.Text,
    icon: "icon-text",
  },
  {
    title: "图形",
    value: DrawingTool.Graphical,
    icon: "icon-graphical",
  },
  {
    title: "橡皮擦",
    value: DrawingTool.Eraser,
    icon: "icon-eraser",
  },
];*/

const props = defineProps<IProps>();

const emits = defineEmits<Emits>();

const { drawingTool, undoDisabled, redoDisabled } = toRefs(props);

const { container, point } = useDragg(props);

const onClick = (type: DrawingTool) => emits("change", type);

const onAction = (type: DrawingTool) => emits("action", type);

const onClose = () => emits("close");
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
    <!-- <div class="drawing-item" @click="() => onAction(DrawingTool.Save)">
      <i class="iconfont icon-download" />
      <p class="title">保存</p>
    </div> -->
    <div class="close-btn" @click="onClose">
      <i class="iconfont icon-close" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./index";
</style>
