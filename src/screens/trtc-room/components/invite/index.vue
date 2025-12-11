<script setup lang="ts">
import UserAdd from "@/icon/user-add/index.vue";
import { roomService } from "@/utils/trtc/roomService";
import InviteIcon from "@icon/invite/index.vue";
import ShareIcon from "@icon/share/index.vue";
import { useNavigation } from "../../../../hooks/useNavigation";
import ActionBtn from "../action-btn/index.vue";

const navigation = useNavigation();

const handleCommand = (command: string) => {
  switch (command) {
    case "/invite":
      const info = roomService.roomStore.meetingInfo;

      navigation.navigate("/invite", { meetingId: info?.meetingId });
      break;
    case "/meeting-invitation-confirm":
      navigation.navigate("/meeting-invitation-confirm", {
        meetingId: roomService.roomStore.meetingInfo?.meetingId,
        meetingSubId: roomService.roomStore.meetingInfo?.meetingSubId,
      });
      break;
    default: {
      break;
    }
  }
};
</script>

<template>
  <el-dropdown placement="top" @command="handleCommand">
    <ActionBtn style="outline: unset" title="邀請" icon="">
      <el-icon :size="32"><invite-icon /></el-icon>
    </ActionBtn>
    <template #dropdown>
      <el-dropdown-menu style="width: 160px">
        <el-dropdown-item command="/meeting-invitation-confirm">
          <el-icon :size="16" color="#292837"><user-add /></el-icon>
          添加參會人
        </el-dropdown-item>
        <el-dropdown-item command="/invite">
          <el-icon :size="16" color="#030303"><share-icon /></el-icon>
          分享會議
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
@use "./index";
</style>
