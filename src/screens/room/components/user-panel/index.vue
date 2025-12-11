<template>
  <div class="user-panel">
    <el-scrollbar>
      <div
        class="user-list-container"
        :class="[
          getGridClass(streamList.length),
          isStreamVideo
            ? 'user-list-container-video'
            : 'user-list-container-normal',
        ]"
      >
        <User
          :class="[isStreamVideo]"
          v-for="stream in streamList"
          :key="stream.id"
          :stream="stream"
        />
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ParticipantStream } from "../../../../utils/livekit/ParticipantStream";
import User from "./components/user/index.vue";

interface Props {
  streamList: ParticipantStream[];
}

const { streamList } = defineProps<Props>();

const isStreamVideo = computed(() => {
  return streamList.some((stream) => stream.cameraStream !== undefined);
});
// 根据参会人员数量返回对应的网格布局类名
const getGridClass = (participantsCount: number) => {
  if (participantsCount === 1) {
    return "default-layout";
  } else {
    if (participantsCount === 2) {
      return "two-panes";
    } else if (participantsCount <= 4) {
      return "four-panes";
    } else if (participantsCount <= 9) {
      return "nine-panes";
    } else if (participantsCount <= 16) {
      return "sixteen-panes";
    } else {
      return "default-layout"; // 可以根据需要自行添加更多布局类名
    }
  }
};
</script>

<style scoped lang="scss">
@use "./index";
</style>
