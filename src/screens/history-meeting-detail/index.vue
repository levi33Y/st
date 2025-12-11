<script setup lang="ts">
import Avatar from "@components/avatar/index.vue";
import Header from "@components/header/index.vue";
import CopyIcon from "@icon/copy/index.vue";
import moment from "moment";
import { MeetingTimeZoneEnum } from "../../services/apis/meeting/types";
import { useAction } from "./hook";

const {
  state,
  totalTime,
  onCopyMeeting,
  openInvite,
  joinMeeting,
  openMemberList,
  getStatusContent,
  viewRecord,
} = useAction();
</script>

<template>
  <Header :hide-maximizable="true" :is-destroy="true" />
  <div class="container">
    <div class="book-meeting-detail-info">
      <div class="book-meeting-info">
        <div class="meeting-title">{{ state.title }}</div>
        <div class="book-meeting-time">
          <div class="time-detail">
            <div>{{ moment(state?.startDate * 1000).format("HH:mm") }}</div>
            <div>
              {{ moment(state?.startDate * 1000).format("YYYY年MM月DD日") }}
            </div>
          </div>
          <div class="time-status">
            <div :style="getStatusContent(state.status)?.style">
              {{ getStatusContent(state.status)?.title ?? "" }}
            </div>
            <div class="total-time">
              {{ totalTime }}
            </div>
            <div v-if="state.timeZone === MeetingTimeZoneEnum.America">
              （GMT-07:00）
            </div>
            <div v-if="state.timeZone === MeetingTimeZoneEnum.Asia">
              （GMT+08:00）
            </div>
          </div>
          <div class="time-detail">
            <div>{{ moment(state?.endDate * 1000).format("HH:mm") }}</div>
            <div>
              {{ moment(state?.endDate * 1000).format("YYYY年MM月DD日") }}
            </div>
          </div>
        </div>
      </div>
      <div class="book-meeting-member">
        <div class="member-detail-item meeting-admin">
          <div class="member-item-label">
            <Avatar :size="40" :name="state.createdByName" />
          </div>
          <div class="member-admin-info">
            <div>發起人</div>
            <div style="font-weight: var(--font-weight-primary)">
              {{ state.createdByName }}
            </div>
          </div>
        </div>
        <div class="member-detail-item meeting-number">
          <div class="member-item-label">會議號：</div>
          <div class="member-number-info">
            <div>{{ state.meetingNumber }}</div>
            <el-icon @click="onCopyMeeting(state?.meetingNumber ?? '')">
              <copy-icon />
            </el-icon>
          </div>
        </div>
        <div class="member-detail-item meeting-member">
          <div class="member-item-label">參會人：</div>
          <div class="member-list">
            <div
              class="member-list-item"
              v-for="(member, index) in state.attendees"
              :key="index"
              @click="openMemberList"
              v-show="index < 6"
            >
              <Avatar :size="32" :name="member.userName" />
            </div>
            <div
              class="member-list-item member-more"
              @click="openMemberList"
              v-if="state.attendees.length > 6"
            >
              +{{ state.attendees.length }}
            </div>
          </div>
        </div>
        <div class="member-detail-item meeting-member">
          <div class="member-item-label">錄製：</div>
          <el-button type="primary" plain size="small" @click="viewRecord">
            查看
          </el-button>
        </div>
      </div>
    </div>
    <div class="option-btn">
      <el-button
        type="primary"
        size="large"
        plain
        @click="openInvite(state.id)"
      >
        邀請
      </el-button>
      <el-button type="primary" size="large" @click="joinMeeting()">
        進入會議
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./index";
</style>
