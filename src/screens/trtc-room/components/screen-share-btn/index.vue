<script setup lang="ts">
import { useNavigation } from "@/hooks/useNavigation";
import { roomService } from "@/utils/trtc/roomService";
import ShareScreenIcon from "@icon/share-screen/index.vue";
import { ElMessage } from "element-plus";
import ActionBtn from "../action-btn/index.vue";

const isSharing = defineModel({ default: false });

const navigation = useNavigation();

const onClick = () => {
  const shareScreenUser = roomService.roomStore.shareScreenUser;

  if (shareScreenUser) {
    ElMessage({
      message: "他人正在共享，此時無法發起共享",
      type: "warning",
    });

    return;
  }

  navigation.navigate("/trtc-screen-dialog", {
    meetingId: roomService.roomStore.meeting?.meetingId,
    meetingSubId: roomService.roomStore.meeting?.meetingSubId,
  });
};
</script>

<template>
  <action-btn
    :title="isSharing ? '結束共享' : '共享屏幕'"
    icon=""
    @click="onClick"
  >
    <el-icon size="32" :color="isSharing ? '#36cf70' : '#5A5B6D'">
      <share-screen-icon />
    </el-icon>
  </action-btn>
</template>

<style scoped lang="scss"></style>
