<!--Common Components-->
<script setup lang="ts">
import MemberListNoJoin from "@/screens/trtc-room/components/member-list/member-list-no-join.vue";
import { UserRoleEnum } from "@/utils/trtc/store/room";
import { Search } from "@element-plus/icons-vue";
import { useAction } from "./hook";
import MemberListAvatar from "./member-list-avatar.vue";
import MemberListMeeting from "./member-list-meeting.vue";
import MemberListMicrophone from "./member-list-microphone.vue";
import RoomStatusTab from "./member-list-tab.vue";
import MemberListWait from "./member-list-wait.vue";
import {
  IEmitsProps,
  IManagementMemberProps,
  IProps,
  MemberListEventEnum,
  MemberListTabEnum,
} from "./props";

const props = defineProps<IProps>();

const emits = defineEmits<IEmitsProps>();

defineExpose({
  switchTab: (val: MemberListTabEnum) => (state.tabStatus = val),
});

const {
  appStore,
  state,
  dialogState,
  searchParticipant,
  userItemRefs,
  localParticipant,
  optionMicrophoneRefs,
  optionUserRefs,
  onHoverUserItem,
  onLeaverUserItem,
  onSubmit,
  onCall,
} = useAction(props, emits);
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
      v-model="state.tabStatus"
      :participants="props.streamList"
      :no-join-meeting-users="noJoinMeetingUsers"
    />

    <div class="user-list" v-loading="state.loading">
      <div
        :ref="
          (el) => {
            userItemRefs[index] = el as HTMLDivElement;
          }
        "
        class="user-item"
        v-for="(participant, index) in searchParticipant as IManagementMemberProps[]"
        :key="participant.id"
        @mouseover="() => onHoverUserItem(index)"
        @mouseout="() => onLeaverUserItem(index)"
      >
        <member-list-avatar
          :local-participant="localParticipant"
          :is-edit="state.tabStatus !== MemberListTabEnum.NoJoin"
          :participant="participant"
          @on-submit="(data) => onSubmit(data)"
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
          :stream="participant"
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
            :meeting-info="props.meetingInfo"
            :local-participant="localParticipant"
            :participant="participant"
            @on-dropdown="() => onLeaverUserItem(index)"
            @on-select="(data) => onSubmit(data)"
          />

          <member-list-wait
            v-else-if="state.tabStatus === MemberListTabEnum.Wait"
            v-model="state.isDropdownVisible"
            @on-select="(data) => onSubmit(data)"
            :participant="participant"
          />
        </div>

        <member-list-no-join
          v-if="state.tabStatus === MemberListTabEnum.NoJoin"
          :meeting-info="props.meetingInfo"
          :participant="participant"
          @on-call="() => onCall(participant)"
        />
      </div>
      <el-empty v-if="searchParticipant.length === 0" />
    </div>

    <div
      class="footer-option"
      v-if="
        (localParticipant.role === UserRoleEnum.CoHost ||
          localParticipant.role === UserRoleEnum.Host) &&
        state.tabStatus !== MemberListTabEnum.NoJoin
      "
    >
      <template v-if="state.tabStatus === MemberListTabEnum.Meeting">
        <el-button
          type="primary"
          size="large"
          :disabled="state.loading"
          @click="
            onSubmit({
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
            onSubmit({
              type: MemberListEventEnum.AllMute,
              data: false,
            })
          "
        >
          解除全體靜音
        </el-button>
      </template>
      <template
        v-else-if="
          state.tabStatus === MemberListTabEnum.Wait &&
          searchParticipant.length > 0
        "
      >
        <el-button
          type="primary"
          size="large"
          :disabled="state.loading"
          @click="
            onSubmit({
              type: MemberListEventEnum.AllAccess,
              data: '',
            })
          "
        >
          全部准入
        </el-button>
        <el-button
          size="large"
          :disabled="state.loading"
          @click="
            onSubmit({
              type: MemberListEventEnum.AllRemove,
              data: '',
            })
          "
        >
          全部移除
        </el-button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
