<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import { useAction } from "./hook";
import MemberListAvatar from "./member-list-avatar.vue";
import MemberListMeeting from "./member-list-meeting.vue";
import MemberListMicrophone from "./member-list-microphone.vue";
import RoomStatusTab from "./member-list-tab.vue";
import MemberListWait from "./member-list-wait.vue";
import {
  IEmitsProps,
  IProps,
  MeetingParticipant,
  MemberListEventEnum,
  MemberListTabEnum,
} from "./props";

const props = defineProps<IProps>();

const emits = defineEmits<IEmitsProps>();

const {
  appStore,
  state,
  dialogState,
  participantList,
  userItemRefs,
  localRole,
  optionMicrophoneRefs,
  optionUserRefs,
  onEditUsername,
  onHoverUserItem,
  onLeaverUserItem,
} = useAction(props);
</script>

<template>
  <div class="member-list">
    <div class="header-filter">
      <el-input
        placeholder="搜索"
        :suffix-icon="Search"
        v-model="state.searchName"
      />
    </div>

    <RoomStatusTab
      v-if="false"
      v-model="state.tabStatus"
      :participants="participantList as MeetingParticipant[]"
    />

    <div class="user-list" v-loading="state.loading">
      <div
        :ref="
          (el) => {
            userItemRefs[index] = el as HTMLDivElement;
          }
        "
        class="user-item"
        v-for="(participant, index) in participantList as MeetingParticipant[]"
        :key="index"
        @mouseover="() => onHoverUserItem(index)"
        @mouseout="() => onLeaverUserItem(index)"
      >
        <member-list-avatar
          :is-edit="state.tabStatus !== MemberListTabEnum.Ending"
          :participant="participant"
          @on-submit="(data) => emits('dataEvent', data)"
        />

        <member-list-microphone
          v-if="state.tabStatus === MemberListTabEnum.Meeting"
          :ref="
            (el) => {
              optionMicrophoneRefs[index] = el as InstanceType<
                typeof MemberListMicrophone
              >;
            }
          "
          class="option-microphone"
          :stream="streamList[index]"
        />

        <div
          class="option-user"
          :ref="
            (el) => {
              optionUserRefs[index] = el as HTMLDivElement;
            }
          "
          style="display: none"
        >
          <member-list-meeting
            v-if="state.tabStatus === MemberListTabEnum.Meeting"
            v-model="state.isDropdownVisible"
            :participant="participant"
            @on-dropdown="() => onLeaverUserItem(index)"
            @on-select="(data) => emits('dataEvent', data)"
          />

          <member-list-wait
            v-else-if="state.tabStatus === MemberListTabEnum.Wait"
            v-model="state.isDropdownVisible"
            :participant="participant"
          />
        </div>
      </div>
    </div>

    <div
      class="footer-option"
      v-if="
        meetingPermission.get(appStore.userInfo.id + '') &&
        state.tabStatus !== MemberListTabEnum.Ending
      "
    >
      <template v-if="state.tabStatus === MemberListTabEnum.Meeting">
        <el-button
          type="primary"
          size="large"
          :disabled="state.loading"
          @click="
            emits('dataEvent', {
              type: MemberListEventEnum.AllMute,
              data: true,
            })
          "
        >
          全體靜音
        </el-button>
        <el-button
          size="large"
          :disabled="state.loading"
          @click="
            emits('dataEvent', {
              type: MemberListEventEnum.AllMute,
              data: false,
            })
          "
        >
          解除全體靜音
        </el-button>
      </template>
      <template v-else-if="state.tabStatus === MemberListTabEnum.Wait">
        <el-button type="primary" size="large" :disabled="state.loading">
          全部准入
        </el-button>
        <el-button size="large" :disabled="state.loading">全部移除</el-button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
