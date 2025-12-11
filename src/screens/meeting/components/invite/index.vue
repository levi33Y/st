<template>
  <ActionBtn title="邀請" icon="icon-invite" @click="() => onToggle(true)" />

  <el-dialog
    class="custom-dialog"
    v-model="visible"
    :width="640"
    :append-to-body="true"
    :center="true"
    :show-close="false"
    :align-center="true"
  >
    <Header
      :title="`會議號：${meetingQuery.meetingNumber}`"
      :is-inner="true"
      borderBottom
      :close="() => onToggle(false)"
    >
      <template #right>
        <div class="invite-header">
          <div class="close-btn" @click="() => onToggle(false)">
            <i class="iconfont icon-close" />
          </div>
        </div>
      </template>
    </Header>
    <div class="invite-body">
      <div class="title">
        {{ meetingQuery.userName }}邀請您加入{{ appStore.appInfo.name }}會議
      </div>
      <div class="invite-item">
        <p>會議主題：</p>
        <p>{{ moderator.userName }}</p>
      </div>
      <div class="invite-item">
        <p>會議號：</p>
        <p>{{ meetingQuery.meetingNumber }}</p>
      </div>
    </div>
    <div class="invite-footer">
      <el-button class="btn" @click="onCopyAll">複製全部信息</el-button>
      <el-button class="btn" type="primary" @click="onCopyMeeting">
        複製會議號
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { useToggle } from "@vueuse/core";
import ActionBtn from "../action-btn/index.vue";
import Header from "../../../../components/header/index.vue";
import { MeetingQuery } from "../../../../entity/types";
import { ElMessage } from "element-plus";
import { useAppStore } from "../../../../stores/useAppStore";
import { UserSession } from "../../../../entity/response";

interface Props {
  meetingQuery: MeetingQuery;
  moderator: UserSession;
}

const { meetingQuery, moderator } = defineProps<Props>();

const appStore = useAppStore();

const [visible, onToggle] = useToggle();

const onCopyAll = () => {
  window.clipboard.writeText(
    `${meetingQuery.userName} 邀請您加入${appStore.appInfo.name}會議\n\r會議主題：${moderator.userName}\n\r會議號：${meetingQuery.meetingNumber}`,
  );
  ElMessage({
    offset: 28,
    message: "會議邀請已複製到剪切板",
    type: "success",
  });
};

const onCopyMeeting = () => {
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
