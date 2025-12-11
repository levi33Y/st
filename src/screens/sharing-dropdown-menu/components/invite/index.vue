<script setup lang="ts">
import { useNavigation } from "@/hooks/useNavigation";
import ShareIcon from "@icon/share/index.vue";
import UserAdd from "@icon/user-add/index.vue";
import { useDebounceFn } from "@vueuse/core";
import { useRoute } from "vue-router";

enum inviteEnum {
  Share,
  Invite,
}

const navigation = useNavigation();

const { query } = useRoute();

const onSendCommand = useDebounceFn(async (command: inviteEnum) => {
  switch (command) {
    case inviteEnum.Share:
      navigation.navigate("/invite", { meetingId: query.meetingId });

      break;
    case inviteEnum.Invite:
      navigation.navigate("/meeting-invitation-confirm", {
        meetingId: query?.meetingId,
        meetingSubId: query?.meetingSubId,
      });

      break;
    default: {
      break;
    }
  }
}, 300);
</script>

<template>
  <div class="container">
    <div class="menu-item" @click="onSendCommand(inviteEnum.Invite)">
      <el-icon :size="16" color="#292837"><user-add /></el-icon>
      添加參會人
    </div>
    <div class="menu-item" @click="onSendCommand(inviteEnum.Share)">
      <el-icon :size="16" color="#030303"><share-icon /></el-icon>
      分享會議
    </div>
  </div>
</template>

<style scoped lang="scss">
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
    cursor: pointer;

    &:hover {
      background-color: #eef0ff;
      color: #475aec;
    }
  }
}
</style>
