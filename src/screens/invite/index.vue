<template>
  <Header
    :title="`會議號：${inviteData.meetingNumber}`"
    :is-destroy="true"
    hideMinimizable
    hideMaximizable
  />
  <div class="invite-body">
    <div class="invite-item">
      {{ inviteData.userName }}邀請您加入{{ appStore.appInfo.name }}會議
    </div>
    <div class="invite-item">
      <p>會議主題：</p>
      <p>{{ inviteData.title }}</p>
    </div>
    <div class="invite-item">
      <p>會議號：</p>
      <p>{{ inviteData.meetingNumber }}</p>
    </div>
    <div class="invite-item">
      <p>會議鏈接：</p>
      <p>{{ inviteData.url }}</p>
    </div>
    <div class="invite-item" v-if="inviteData.passWard">
      <p>密碼：</p>
      <p>{{ inviteData.passWard }}</p>
    </div>
  </div>
  <div class="invite-footer">
    <el-button class="btn default-btn" @click="onCopyAll">
      複製全部信息
    </el-button>
    <el-button class="btn" type="primary" @click="onCopyMeeting">
      複製會議號
    </el-button>
    <el-button class="btn" type="primary" @click="onCopyUrl">
      複製會議鏈接
    </el-button>
  </div>
</template>

<script setup lang="ts">
import Header from "../../components/header/index.vue";
import { useAction } from "./hooks";
const {
  onCopyAll,
  onCopyMeeting,
  visible,
  onToggle,
  onCopyUrl,
  inviteData,
  appStore,
} = useAction();
</script>

<style scoped lang="scss">
@use "./index";
</style>
