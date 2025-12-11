<script setup lang="ts">
import PeopleIcon from "@/icon/people/index.vue";
import ActionBtn from "@/screens/trtc-room/components/action-btn/index.vue";
import { TabsEnum } from "@/screens/trtc-room/components/room-tab/props";
import { OnlineTypeEnum } from "@/services/apis/meeting/types";
import emitter, { MeetingEventEnum } from "@/utils/trtc/hook/useMitt";
import { roomService } from "@/utils/trtc/roomService";
import { computed } from "vue";

const memberSize = computed(() => {
  return roomService.roomStore.userList.filter((item) =>
    [OnlineTypeEnum.Online, OnlineTypeEnum.Waiting].includes(item.status),
  ).length;
});

const onClick = () => {
  emitter.emit(MeetingEventEnum.MemberManagerEvent, {
    type: "ShowSidebar",
    data: {
      name: TabsEnum.MemberList,
      title: `${TabsEnum.MemberList}(${memberSize.value ?? 0})`,
    },
  });
};
</script>

<template>
  <action-btn
    :title="memberSize ? `成員(${memberSize})` : '成員'"
    icon="icon-avatar"
    @click="onClick"
  >
    <el-icon :size="32"><people-icon /></el-icon>
  </action-btn>
</template>

<style scoped lang="scss"></style>
