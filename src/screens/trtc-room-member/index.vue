<script setup lang="ts">
import Header from "@components/header/index.vue";
import MemberList from "@/screens/trtc-room/components/member-list/index.vue";
import { useAction } from "./hook";

const {
  appStore,
  meetingInfo,
  participantList,
  handleMemberListDataReceived,
  noJoinMeetingUsers,
  waitingRoomUserSessions,
} = useAction();
</script>

<template>
  <Header v-show="!appStore.isFullscreen" title="管理成員" />

  <div class="container">
    <div class="member-list-body">
      <member-list
        ref="memberListRef"
        :meeting-info="meetingInfo"
        :stream-list="participantList"
        :no-join-meeting-users="noJoinMeetingUsers"
        :waiting-room-user-sessions="waitingRoomUserSessions"
        @data-event="handleMemberListDataReceived"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./index.scss";
</style>
