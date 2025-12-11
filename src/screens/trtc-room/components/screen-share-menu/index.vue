<script setup lang="ts">
import InviteIcon from "@/icon/invite/index.vue";
import PeopleIcon from "@/icon/people/index.vue";
import Secure from "@/icon/secure/index.vue";
import { MeetingDropdownEnum } from "@/screens/sharing-dropdown-menu/props";
import ActionBtn from "@/screens/trtc-room/components/action-btn/index.vue";
import AudioManage from "@/screens/trtc-room/components/audio-manage/index.vue";
import Footer from "@/screens/trtc-room/components/footer/index.vue";
import Network from "@/screens/trtc-room/components/network/index.vue";
import RecordingBtn from "@/screens/trtc-room/components/recording-btn/index.vue";
import ScreenShareBtn from "@/screens/trtc-room/components/screen-share-btn/index.vue";
import VideoManage from "@/screens/trtc-room/components/video-manage/index.vue";
import { Menu } from "@element-plus/icons-vue";
import { useAction } from "./hooks";

const visibleModel = defineModel({ default: false });

const {
  tipRef,
  menuRef,
  showDetail,
  loading,
  meeting,
  isHost,
  recordingState,
  memberSize,
  handleEndShare,
  pause,
  resume,
  onOpenMenu,
  onOpenMemberList,
  onStopShare,
} = useAction(visibleModel);

defineExpose({
  keepExpanding: pause,
  autoShrink: resume,
});
</script>

<template>
  <div v-show="visibleModel && !loading" class="container">
    <div v-show="!showDetail" ref="tipRef" class="page-model tip">
      <div style="pointer-events: none">
        <div class="room-sharing-tip">
          <Network is-info-visible />
          <i
            v-if="recordingState.isRecording"
            class="iconfont icon-record"
            style="color: #f3333e"
          />
          你正在共享屏幕
        </div>
      </div>
    </div>

    <div v-show="showDetail" class="page-model menu">
      <div class="room-sharing-menu-status">
        <Network is-info-visible />
        <!--        <participate-duration v-model="state.participateDuration" />-->
        {{ meeting.meetingTitle }}
      </div>

      <Footer>
        <template #left>
          <AudioManage />
          <VideoManage />
        </template>
        <template #content>
          <screen-share-btn />
          <action-btn
            v-if="isHost"
            :title="`安全`"
            icon="icon-avatar"
            @click="
              () => {
                onOpenMenu(MeetingDropdownEnum.Security);
              }
            "
          >
            <el-icon :size="32">
              <el-icon :size="25"><secure /></el-icon>
            </el-icon>
          </action-btn>
          <action-btn
            style="outline: unset"
            title="邀請"
            icon=""
            @click="
              () => {
                onOpenMenu(MeetingDropdownEnum.Invite);
              }
            "
          >
            <el-icon :size="32"><invite-icon /></el-icon>
          </action-btn>
          <action-btn
            :title="memberSize ? `成員(${memberSize})` : '成員'"
            icon="icon-avatar"
            @click="onOpenMemberList"
          >
            <el-icon :size="32"><people-icon /></el-icon>
          </action-btn>
          <recording-btn :isRecording="recordingState.isRecording" />
          <ActionBtn
            style="outline: unset"
            title="功能"
            icon=""
            @click="
              () => {
                onOpenMenu(MeetingDropdownEnum.Function);
              }
            "
          >
            <el-icon :size="32"><Menu /></el-icon>
          </ActionBtn>
        </template>
        <template #right>
          <el-button type="danger" plain @click="onStopShare">
            結束共享
          </el-button>
        </template>
      </Footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./index";
</style>
