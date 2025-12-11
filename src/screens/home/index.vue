<template>
  <Header
    class="header"
    :title="`${appStore.appInfo.name}`"
    :is-destroy="true"
    :hideMaximizable="true"
  />
  <div class="container">
    <div class="user-info">
      <UserInfo @logout="onLogout" />
      <div style="display: flex; column-gap: 0.8rem">
        <el-badge
          :show-zero="false"
          :value="state.recordBadge"
          class="settings"
        >
          <i
            @click="onRecordList"
            class="iconfont icon-record-red"
            style="color: var(--color-primary)"
          />
          錄製
        </el-badge>
        <div class="settings" @click="gotoSettings">
          <i class="iconfont icon-settings" />
          設置
        </div>
      </div>
    </div>
    <div class="meeting-btns">
      <!-- <div class="meeting-row">
        <template v-if="appStore.isMeeting">
          <div class="meeting-btn">
            <JoinBtn
              :highlight="true"
              title="返回会议"
              icon="icon-goback"
              @click="onBackMeeting"
            />
          </div>
        </template>
        <template v-else>
          <div class="meeting-btn">
            <JoinBtn title="加入会议" icon="icon-add" @click="onJoinMeeting" />
          </div>
        </template>

        <div class="meeting-btn">
          <JoinBtn
            :disabled="appStore.isMeeting"
            title="快速会议"
            icon="icon-quick"
            @click="onQuickMeeting"
          />
        </div>
      </div> -->

      <div class="meeting-row">
        <template v-if="appStore.isMeeting">
          <div class="meeting-btn">
            <JoinBtn
              :highlight="true"
              title="返回會議"
              icon="icon-goback"
              @click="onBackMeeting"
            />
          </div>
        </template>
        <template v-else>
          <div class="meeting-btn">
            <JoinBtn
              title="加入會議"
              icon="icon-add2"
              @click="onJoinLiveKitMeeting"
            />
          </div>
        </template>

        <div class="meeting-btn">
          <JoinBtn
            :disabled="appStore.isMeeting"
            title="快速會議"
            icon="icon-quick"
            @click="onLiveKitMeeting"
          />
        </div>
        <div class="meeting-btn">
          <JoinBtn
            :disabled="appStore.isMeeting"
            title="預定會議"
            icon="icon-reserve"
            @click="onScheduleLiveKitMeeting"
          />
        </div>
        <div class="meeting-btn">
          <JoinBtn
            :disabled="appStore.isMeeting"
            title="曆史會議"
            icon="icon-a-Vector3"
            @click="onHistoryLiveKitMeeting"
          />
        </div>
      </div>
      <div class="divider-horizontal" />
    </div>
    <meeting-minutes ref="meetingMinutesRef" />
  </div>
</template>

<script setup lang="ts">
import Header from "../../components/header/index.vue";
import JoinBtn from "./components/join-btn/index.vue";
import MeetingMinutes from "./components/meeting-minutes/index.vue";
import UserInfo from "./components/user-info/index.vue";
import { useAction } from "./hooks";

const {
  appStore,
  state,
  meetingMinutesRef,
  getKeyError,
  onJoinMeeting,
  onQuickMeeting,
  onJoinLiveKitMeeting,
  onScheduleLiveKitMeeting,
  onHistoryLiveKitMeeting,
  onLiveKitMeeting,
  onBackMeeting,
  gotoSettings,
  onLogout,
  onRecordList,
  navigation,
} = useAction();
</script>

<style scoped lang="scss">
@use "./index";
</style>
