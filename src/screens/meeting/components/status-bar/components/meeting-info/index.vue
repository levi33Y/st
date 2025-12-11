<template>
  <el-popover
    placement="bottom"
    :width="200"
    trigger="hover"
    :show-arrow="true"
  >
    <template #reference>
      <div class="meeting-info">
        <i class="iconfont icon-info" />
      </div>
    </template>
    <div class="meeting-info-container">
      <p class="title">{{ moderator.userName }}</p>
      <div class="info-item">
        <p class="info-label">會議號：</p>
        <p>{{ meetingQuery?.meetingNumber }}</p>
        <i class="iconfont icon-copy" @click="onCopy" />
      </div>
      <div class="info-item">
        <p class="info-label">主持人：</p>
        <p>{{ moderator.userName }}</p>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { MeetingQuery } from "../../../../../../entity/types";
import { useAppStore } from "../../../../../../stores/useAppStore";
import { UserSession } from "../../../../../../entity/response";

interface Props {
  meetingQuery: MeetingQuery;
  moderator: UserSession;
}

const { meetingQuery, moderator } = defineProps<Props>();

const appStore = useAppStore();

const onCopy = () => {
  window.clipboard.writeText(
    `#${appStore.appInfo.name}：${meetingQuery.meetingNumber}`,
  );
  ElMessage({
    offset: 28,
    message: "會議號已複製到粘貼板",
    type: "success",
  });
};
</script>

<style scoped lang="scss">
@use "./index";
</style>
