<template>
  <div
    v-if="!state.isScreenShareEnabled"
    :class="[
      'room-page',
      state.shareStream &&
        (stoped || !focused ? 'share-mode-isBlur' : 'share-mode'),
    ]"
  >
    <Header v-show="!appStore.isFullscreen" :close="blockClose" />

    <div class="page-layout">
      <div class="container" ref="roomContainerRef">
        <StatusBar
          :meeting-number="meetingQuery.meetingNumber"
          :moderator-name="moderator.userName ?? ''"
          :title="meetingTitle"
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

        <UserPanel :streamList="streamList" />

        <template v-if="state.shareStream">
          <div class="share-screen">
            <Player
              :stream="state.shareStream"
              @update="drawingBoardRef?.resize"
            >
              <interactive-whiteboard
                ref="drawingBoardRef"
                :is-master="false"
                @tEduBoardEvent="tEduBoardEvent"
                :user-info="{
                  userSid: userIdentity,
                  meetingNumber: meetingQuery.meetingNumber,
                }"
              />
            </Player>
            <UserList :stream-list="streamList" />
          </div>
        </template>

        <Speaking :speakers="speakersList" />

        <Footer>
          <template #left>
            <AudioManage
              :localStream="localStream"
              :update="updateMicMuteStatus"
            />
            <VideoManage
              :is-camera-enabled="meetingQuery.enableCamera"
              :update="updateCamera"
            />
          </template>

          <template #content>
            <screen-share-btn @switch="onScreenShareClick" />
            <secure-btn
              v-if="meetingPermissionMap?.get(appStore.userInfo.id + '')"
              @command="onSecureFunction"
              :lock-checked="meetingStore.isLocked"
            />
            <Invite :meetingId="meetingId" />
            <ActionBtn
              :title="`成員(${streamList.length ?? 0})`"
              icon="icon-avatar"
              @click="
                onOpenTab({
                  name: TabsEnum.MemberList,
                  title: `${TabsEnum.MemberList}(${streamList.length ?? 0})`,
                })
              "
            >
              <el-icon :size="32"><people-icon /></el-icon>
            </ActionBtn>
            <Recording
              :isRecording="recordingState.isRecording"
              :disable="isRecordDisable"
              :update="updateRecording"
            />
            <!--            <EchoAvatarBtn
              ref="echoAvatarBtnRef"
              @click="onOpenEA"
              :send-echo-avatar="sendEchoAvatar"
              :meetingId="meetingId"
            />-->
            <tool-btn
              @command="onMoreFunction"
              :draw-disable="!state.shareStream"
            />
          </template>

          <template #right>
            <LeaveMeeting
              ref="leaveMeetingRef"
              @on-leave-meeting="leaveMeeting"
              @on-end-meeting="endMeeting"
            />
          </template>
        </Footer>
      </div>

      <room-tab ref="roomTabRef" class="room-tab" v-model="state.roomTabValue">
        <member-list
          v-if="state.roomTabValue === TabsEnum.MemberList"
          :stream-list="streamList"
          :meeting-permission="meetingPermissionMap"
          @data-event="handleMemberListDataReceived"
        />
      </room-tab>

      <template v-if="streamList.length > 0">
        <div v-if="appStore.isOpenEA" class="echo-avatar-container">
          <EchoAvatar
            ref="echoAvatarRef"
            :meeting-id="meetingId"
            :target-language-type="targetLanguageType"
            :send-echo-avatar="sendEchoAvatar"
            :updateMicMuteStatus="updateMicMuteStatus"
          />
        </div>
      </template>
    </div>
  </div>

  <room-sharing ref="roomSharingRef" v-model="state.isScreenShareEnabled">
    <template #tip>
      <div class="room-sharing-tip">
        <Network is-info-visible />
        <i
          v-if="recordingState.isRecording"
          class="iconfont icon-record"
          style="color: #f3333e"
        />
        你正在共享屏幕
      </div>
    </template>
    <template #menu>
      <div class="room-sharing-menu-status">
        <Network is-info-visible />
        <participate-duration v-model="state.participateDuration" />
        {{ meetingTitle }}
      </div>
      <Footer>
        <template #left>
          <AudioManage
            :localStream="localStream"
            :update="updateMicMuteStatus"
          />
          <VideoManage
            :is-camera-enabled="meetingQuery.enableCamera"
            :update="updateCamera"
          />
        </template>
        <template #content>
          <screen-share-btn @switch="onScreenShareClick" />
          <ActionBtn
            v-if="meetingPermissionMap?.get(appStore.userInfo.id + '')"
            :title="`安全`"
            icon="icon-avatar"
            @click="onOpenSecurityMenu"
          >
            <el-icon :size="32">
              <el-icon :size="25"><secure /></el-icon>
            </el-icon>
          </ActionBtn>
          <Invite :meetingId="meetingId" />
          <ActionBtn
            :title="`成員(${streamList.length ?? 0})`"
            icon="icon-avatar"
            @click="onOpenMemberList"
          >
            <el-icon :size="32"><people-icon /></el-icon>
          </ActionBtn>
          <Recording
            :isRecording="recordingState.isRecording"
            :disable="isRecordDisable"
            :update="updateRecording"
          />
          <ActionBtn
            title="互動批注"
            icon=""
            @click="onMoreFunction('draw')"
            :moderator-disabled="!isWhiteboardReady"
          >
            <el-icon :size="30" :color="`${!isWhiteboardReady && '#5A5B6D'}`">
              <draw-edit />
            </el-icon>
          </ActionBtn>
        </template>
        <template #right>
          <el-button type="danger" plain @click="endSharing">
            結束共享
          </el-button>
        </template>
      </Footer>
    </template>
  </room-sharing>

  <AudioPlayer :stream-list="streamList" />
</template>

<script setup lang="ts">
import DrawEdit from "@/icon/draw-edit/index.vue";
import Secure from "@/icon/secure/index.vue";
import RoomSharing from "@/screens/room/components/screen-share-menu/index.vue";
import InteractiveWhiteboard from "@components/interactive-whiteboard/index.vue";
import MemberList from "@components/member-list/index.vue";
import PeopleIcon from "@icon/people/index.vue";
import Header from "../../components/header/index.vue";
import ActionBtn from "./components/action-btn/index.vue";
import AudioManage from "./components/audio-manage/index.vue";
import AudioPlayer from "./components/audio-player/index.vue";
import EchoAvatar from "./components/echo-avatar/index.vue";
import Footer from "./components/footer/index.vue";
import Fullscreen from "./components/fullscreen/index.vue";
import Invite from "./components/invite/index.vue";
import LeaveMeeting from "./components/leave-meeting/index.vue";
import Network from "./components/network/index.vue";
import ParticipateDuration from "./components/participate-duration/index.vue";
import Player from "./components/player/index.vue";
import Recording from "./components/recording/index.vue";
import RoomTab from "./components/room-tab/index.vue";
import { TabsEnum } from "./components/room-tab/props";
import ScreenShareBtn from "./components/screen-share-btn/index.vue";
import secureBtn from "./components/secure-btn/index.vue";
import Speaking from "./components/speaking/index.vue";
import StatusBar from "./components/status-bar/index.vue";
import ToolBtn from "./components/tool-btn/index.vue";
import UserList from "./components/user-list/index.vue";
import UserPanel from "./components/user-panel/index.vue";
import VideoManage from "./components/video-manage/index.vue";
import { useAction, useEchoAvatar, useMouse } from "./trtc";

const emits = defineEmits<{
  (event: "reloadToggle"): void;
}>();

const {
  leaveMeetingRef,
  echoAvatarRef,
  drawingBoardRef,
  roomContainerRef,
  roomTabRef,
  appStore,
  localStream,
  streamList,
  meetingQuery,
  state,
  moderator,
  shareParticipant,
  speakersList,
  targetLanguageType,
  recordingState,
  meetingId,
  meetingTitle,
  blockClose,
  updateMicMuteStatus,
  updateCamera,
  beforeStartShare,
  startShare,
  stopShare,
  endSharing,
  leaveMeeting,
  endMeeting,
  sendDrawing,
  sendEchoAvatar,
  sendKicOutUser,
  onOpenTab,
  updateRecording,
  publishData,
  meetingPermissionMap,
  roomSharingRef,
  onResetShare,
  settingsStore,
  creatorId,
  echoAvatarBtnRef,
  handleMemberListDataReceived,
  isRecordDisable,
  onScreenShareClick,
  onMoreFunction,
  onOpenMemberList,
  meetingStore,
  onSecureFunction,
  onOpenSecurityMenu,
  tEduBoardEvent,
  userIdentity,
  isWhiteboardReady,
} = useAction(emits);

const { stoped, focused } = useMouse();

const { onOpenEA } = useEchoAvatar();
</script>

<style lang="scss" scoped>
@use "./index";
</style>
