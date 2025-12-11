<template>
  <div
    ref="target"
    class="user-list-container"
    :style="`width: ${isExpand ? width : 0}px;`"
  >
    <el-scrollbar>
      <div class="user-box-list">
        <User v-for="stream in streamList" :key="stream.id" :stream="stream" />
      </div>
    </el-scrollbar>
    <div class="expand-btn" @click="onExpand">
      <i :class="['iconfont icon-arrow-left', isExpand && 'active']" />
    </div>
    <div ref="handle" class="drag-resize" />
  </div>
</template>

<script setup lang="ts">
import { useDraggResize, useAction } from "./hooks";
import User from "./components/user/index.vue";
import { ParticipantStream } from "../../../../utils/livekit/ParticipantStream";

interface Props {
  streamList: ParticipantStream[];
}

const { width, target, handle } = useDraggResize();

const { isExpand, onExpand } = useAction();

const { streamList } = defineProps<Props>();
</script>

<style scoped lang="scss">
@use "./index";
</style>
