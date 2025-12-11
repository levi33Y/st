<script setup lang="ts">
import { OnlineTypeEnum } from "@/entity/response";
import { INoJoinMeetingUsersProps } from "@/services/apis/meeting/types";
import { useAppStore } from "@/stores/useAppStore";
import { UserRoleEnum } from "@/utils/trtc/store/room";
import { computed } from "vue";
import { IManagementMemberProps, MemberListTabEnum } from "./props";

const props = defineProps<{
  participants: IManagementMemberProps[];
  noJoinMeetingUsers: INoJoinMeetingUsersProps[];
}>();

const activeTabModel = defineModel<MemberListTabEnum>({
  default: MemberListTabEnum.Meeting,
});

const appStore = useAppStore();

const onSwitchTab = (tab: MemberListTabEnum) => {
  activeTabModel.value = tab;
};

const meetingNumberSize = computed(
  () =>
    props.participants?.filter((item) => item.status === OnlineTypeEnum.Online)
      ?.length,
);

const waitingRoomUserSessionsSize = computed(
  () =>
    props.participants?.filter((item) => item.status === OnlineTypeEnum.Waiting)
      ?.length,
);

const isWaitDisabled = computed(() => {
  let role =
    props.participants.find(
      (item) => item.id + "" === appStore.userInfo.id + "",
    )?.role ?? UserRoleEnum.Participant;

  return [UserRoleEnum.Host, UserRoleEnum.CoHost].includes(role);
});
</script>

<template>
  <div class="member-list-tab">
    <div
      :class="[
        'tab-option',
        { 'tab-active': activeTabModel === MemberListTabEnum.Meeting },
      ]"
      @click="onSwitchTab(MemberListTabEnum.Meeting)"
    >
      會議中{{ meetingNumberSize }}
    </div>
    <div
      :class="[
        'tab-option',
        { 'tab-active': activeTabModel === MemberListTabEnum.Wait },
      ]"
      @click="onSwitchTab(MemberListTabEnum.Wait)"
      v-if="isWaitDisabled"
    >
      等候室{{ waitingRoomUserSessionsSize }}
    </div>
    <div
      :class="[
        'tab-option',
        { 'tab-active': activeTabModel === MemberListTabEnum.NoJoin },
      ]"
      @click="onSwitchTab(MemberListTabEnum.NoJoin)"
    >
      未入會{{ noJoinMeetingUsers?.length }}
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
