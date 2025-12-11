<template>
  <div class="meeting-minutes" ref="scrollContainer" @scroll="handleScroll">
    <div v-for="(item, index) in scheduleStore.scheduleList" :key="index">
      <div class="mask-meeting-minutes">
        <div class="meeting-date">{{ item.formattedDate }}</div>
        <div
          v-for="(content, scheduleIndex) in item.meetingScheduleData"
          :key="content.meetingId"
        >
          <div
            class="meeting-message"
            :ref="
              (el) => {
                const i =
                  toRaw(scheduleStore.scheduleList)
                    .slice(0, index)
                    ?.map((l) => l?.meetingScheduleData)
                    ?.flat(1).length ?? 0;

                meetingMessageRefs[i + scheduleIndex] = el;
              }
            "
            @mouseover="() => onMeetingItemOption(content.meetingId, 'hover')"
            @mouseout="() => onMeetingItemOption(content.meetingId, 'leaver')"
          >
            <div class="meeting-minutes-item">
              <span>{{ content.durationTime }}</span>
              <el-tooltip class="box-item" effect="light" placement="top-end">
                <template #content>
                  <span style="color: var(--color-primary)">
                    點擊複製會議號
                  </span>
                </template>
                <el-button
                  link
                  class="meeting-number"
                  @click="onCopyMeeting(content.meetingNumber)"
                >
                  {{ content.meetingNumber }}
                </el-button>
              </el-tooltip>
              <span>
                {{
                  content.repeatType !== MeetingRepeatType.None ? " · 週期" : ""
                }}
              </span>
              <span
                class="meeting-status"
                :style="getStatusContent(content.status)?.style"
              >
                {{ getStatusContent(content.status)?.text }}
              </span>
            </div>
            <div class="meeting-hover-status">
              <div class="meeting-title">{{ content.title }}</div>
              <div
                class="hover-button"
                :ref="
                  (el) => {
                    const i =
                      toRaw(scheduleStore.scheduleList)
                        .slice(0, index)
                        ?.map((l) => l?.meetingScheduleData)
                        ?.flat(1).length ?? 0;

                    hoverButtonRefs[i + scheduleIndex] = el;
                  }
                "
              >
                <el-dropdown
                  @visible-change="
                    (val: boolean) => {
                      state.isDropdownVisible = val;

                      onMeetingItemOption(content.meetingId, 'leaver');
                    }
                  "
                >
                  <el-icon :size="20" class="option-ellipsis">
                    <ellipsis-icon />
                  </el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        @click="onOpenMeetingListDetail(content.meetingNumber)"
                      >
                        查看詳情
                      </el-dropdown-item>
                      <el-dropdown-item
                        :disabled="content.status !== MeetingStatus.Pending"
                        @click="onEditMeeting(content.meetingNumber)"
                      >
                        修改會議
                      </el-dropdown-item>
                      <el-dropdown-item
                        :disabled="content.status !== MeetingStatus.Pending"
                        @click="
                          cancelMeetingMinute(
                            index,
                            scheduleIndex,
                            content.meetingId,
                          )
                        "
                      >
                        取消會議
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-icon
                  class="meeting-share"
                  :size="20"
                  @click="openInvite(content.meetingId)"
                  color="#475AEC"
                >
                  <share-icon />
                </el-icon>

                <el-button
                  class="meeting-invite-status"
                  size="small"
                  type="primary"
                  color="#4966ff"
                  round
                  @click="joinMeeting(content.meetingNumber)"
                >
                  入會
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import EllipsisIcon from "@icon/ellipsis/index.vue";
import ShareIcon from "@icon/share/index.vue";
import { toRaw } from "vue";
import { MeetingRepeatType, MeetingStatus } from "../../../../entity/enum";
import { useAction } from "./hooks";

const {
  state,
  hoverButtonRefs,
  meetingMessageRefs,
  openInvite,
  meetingScheduleList,
  scheduleStore,
  handleScroll,
  onEditMeeting,
  joinMeeting,
  getStatusContent,
  scrollContainer,
  cancelMeetingMinute,
  onCopyMeeting,
  onOpenMeetingListDetail,
  onMeetingItemOption,
  meetingMinutesList,
  handleUpdateMeetingScheduleList,
} = useAction();

defineExpose({
  meetingMinutesList: handleUpdateMeetingScheduleList,
});
</script>

<style lang="scss" scoped>
@use "./index";
</style>
