<template>
  <div class="user-panel">
    <el-scrollbar>
      <div
        :class="[
          isStreamVideo
            ? `user-list-container-video ${getGridClass(userList.length)}`
            : 'user-list-container-normal',
        ]"
      >
        <User v-for="stream in userList" :key="stream.id" :stream="stream" />
        <no-join-user
          v-for="participant in noJoinUserList"
          :key="participant.id"
          :participant="participant"
        />
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import NoJoinUser from "./components/no-join-user/index.vue";
import User from "./components/user/index.vue";

import { roomService } from "@/utils/trtc/roomService";
import { isNil } from "lodash";

const userList = computed(() => {
  return roomService.roomStore.onlineUserList;
});

const noJoinUserList = computed(() => {
  return roomService.roomStore.onJoinUsers.filter((item) => {
    return !roomService.roomStore.roomUserIdList.includes(item?.id + "");
  });
});

const isStreamVideo = computed(() => {
  return roomService.roomStore.userList.some(
    (stream) => !isNil(stream.cameraStream),
  );
});

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
