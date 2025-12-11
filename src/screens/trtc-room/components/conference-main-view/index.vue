<script setup lang="ts">
import { OnlineTypeEnum } from "@/entity/response";
import MemberList from "@/screens/trtc-room/components/member-list/index.vue";
import { MemberListTabEnum } from "@/screens/trtc-room/components/member-list/props";
import { roomService } from "@/utils/trtc/roomService";
import Header from "@components/header/index.vue";
import AudioManage from "../audio-manage/index.vue";
import ConferenceSkeleton from "../conference-skeleton/index.vue";
import Footer from "../footer/index.vue";
import Fullscreen from "../fullscreen/index.vue";
import InviteBtn from "../invite/index.vue";
import LeaveMeeting from "../leave-meeting/index.vue";
import MemberBtn from "../member-btn/index.vue";
import ParticipateDuration from "../participate-duration/index.vue";
import Player from "../player/index.vue";
import RecordingBtn from "../recording-btn/index.vue";
import RoomTab from "../room-tab/index.vue";
import { TabsEnum } from "../room-tab/props";
import ScreenShareBtn from "../screen-share-btn/index.vue";
import RoomSharing from "../screen-share-menu/index.vue";
import secureBtn from "../secure-btn/index.vue";
import Speaking from "../speaking/index.vue";
import StatusBar from "../status-bar/index.vue";
import ToolBtn from "../tool-btn/index.vue";
import UserPanel from "../user-panel/index.vue";
import VideoManage from "../video-manage/index.vue";
import WaitingPanel from "../waiting-panel/index.vue";
import { useAction } from "./hooks";

const {
  stoped,
  focused,
  leaveMeetingRef,
  drawingBoardRef,
  roomContainerRef,
  recordingBtnRef,
  roomTabRef,
  appStore,
  streamList,
  meetingQuery,
  state,
  moderator,
  recordingState,
  roomSharingRef,
  settingsStore,
  userSate,
  noJoinMeetingUsers,
  waitingRoomUserSessions,
  waitingReminder,
  memberListRef,
  roomStore,
  isModerator,
  isSharingScreen,
  meetingInfo,
  meetingPermissionMap,
  isWaitingRoomEnabled,
  isHasShareScreen,
  meetingUserSessions,
  blockClose,
  startShare,
  stopShare,
  leaveMeeting,
  endMeeting,
  onShowSidebar,
  publishData,
  handleMemberListDataReceived,
  jumpManagementList,
} = useAction();
</script>

<template>
  <div
    :class="[
      'room-page',
      isHasShareScreen &&
        (stoped || !focused ? 'share-mode-isBlur' : 'share-mode'),
    ]"
    v-show="!isSharingScreen"
  >
    <Header v-show="!appStore.isFullscreen" :close="blockClose" />

    <div v-if="userSate === OnlineTypeEnum.Online" class="page-layout">
      <div class="container" ref="roomContainerRef">
        <StatusBar
          :meeting-number="meetingQuery.meetingNumber"
          :moderator-name="moderator.userName ?? ''"
          :title="meetingInfo?.meeting?.title ?? ''"
        >
          <template #right>
            <participate-duration
              v-if="settingsStore.showMeetingDuration"
              v-model="state.participateDuration"
            />
            <div class="recording-icon" v-show="recordingState.isRecording">
              <i class="iconfont icon-record" style="color: #f3333e" />
              <span>錄製中</span>
            </div>
            <fullscreen />
          </template>
        </StatusBar>

        <Speaking />

        <div class="share-screen" v-if="roomService.roomStore.screenStream">
          <Player />
        </div>

        <UserPanel />

        <Footer>
          <template #left>
            <audio-manage />
            <video-manage />
          </template>

          <template #content>
            <screen-share-btn />
            <secure-btn />
            <invite-btn />
            <member-btn />
            <recording-btn ref="recordingBtnRef" />
            <tool-btn />
          </template>

          <template #right>
            <LeaveMeeting
              ref="leaveMeetingRef"
              @on-leave-meeting="leaveMeeting"
              @on-end-meeting="endMeeting"
            />
          </template>
        </Footer>

        <div
          class="waitingReminderContainer"
          v-show="waitingReminder.dialogVisible"
        >
          <div class="modal-header">
            <span>
              當前等候室已有
              <span class="highlight">{{ waitingReminder.size }}</span>
              人等候
            </span>
            <span
              class="close-button"
              @click="waitingReminder.dialogVisible = false"
            >
              &times;
            </span>
          </div>
          <div class="modal-buttons">
            <el-button
              plain
              class="secondary-button"
              @click="
                () => {
                  waitingReminder.dialogVisible = false;
                  waitingReminder.isIgnore = true;
                }
              "
            >
              不再提醒
            </el-button>
            <el-button
              type="primary"
              @click="
                () => {
                  jumpManagementList(MemberListTabEnum.Wait);

                  waitingReminder.dialogVisible = false;
                }
              "
            >
              查看等候室
            </el-button>
          </div>
        </div>
      </div>

      <room-tab ref="roomTabRef" class="room-tab" v-model="state.roomTabValue">
        <member-list
          ref="memberListRef"
          v-if="state.roomTabValue === TabsEnum.MemberList"
          :meeting-info="roomService.roomStore.meeting"
          :stream-list="streamList"
          :no-join-meeting-users="noJoinMeetingUsers"
          :waiting-room-user-sessions="waitingRoomUserSessions"
          @data-event="handleMemberListDataReceived"
        />
      </room-tab>
    </div>

    <waiting-panel
      v-else-if="userSate === OnlineTypeEnum.Waiting"
      @leave-meeting="() => leaveMeeting()"
      :meetingUserSessions="meetingUserSessions"
    />

    <conference-skeleton
      v-else-if="userSate !== OnlineTypeEnum.KickOutMeeting"
    />
  </div>

  <room-sharing ref="roomSharingRef" v-model="isSharingScreen" />
</template>

<style lang="scss" scoped>
@use "index";
</style>
