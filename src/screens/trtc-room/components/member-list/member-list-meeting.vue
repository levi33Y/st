<script setup lang="ts">
import { confirm } from "@/screens/trtc-room/components/member-list/utlis";
import {
  IMeetingInfoProps,
  IUserInfoProps,
  UserRoleEnum,
} from "@/utils/trtc/store/room";
import { computed } from "vue";
import {
  IDataEventProps,
  IManagementMemberProps,
  MemberListEventEnum,
} from "./props";

enum DropdownMenuItemEnum {
  TransferHost = "轉讓主持人",
  ReclaimHost = "收回主持人",
  SetCoHost = "設為聯席主持人",
  RemoveCoHost = "撤銷聯席主持人",
  MoveToWaitRoom = "移至等候室",
  RemoveFromMeeting = "移出會議室",
}

export interface IDropdownItemProps {
  text: DropdownMenuItemEnum;
  role: boolean;
  params: {
    type: MemberListEventEnum;
    data: any;
  };
}

const dropdownVisibleModel = defineModel<boolean>({ default: false });

const props = defineProps<{
  meetingInfo: IMeetingInfoProps;
  participant: IManagementMemberProps;
  localParticipant: IUserInfoProps;
}>();

const emits = defineEmits<{
  (event: "onSelect", data: IDataEventProps): void;
  (event: "onDropdown"): void;
}>();

const isModerator = computed(
  () => props.localParticipant?.role === UserRoleEnum.Host,
);

const isHasHost = computed(
  () =>
    props.localParticipant?.role === UserRoleEnum.CoHost ||
    props.localParticipant?.role === UserRoleEnum.Host,
);

const isCreator = computed(
  () => props.meetingInfo.creatorId === props.localParticipant?.id,
);

const isNotAnonymity = computed(() => {
  return props.participant?.sid?.split("_")?.at(0) != "Anonymity";
});

const dropdownItems = computed(() => [
  {
    text: DropdownMenuItemEnum.TransferHost,
    role:
      isModerator.value &&
      props?.participant.role !== UserRoleEnum.Host &&
      isNotAnonymity.value,
    params: {
      type: MemberListEventEnum.Role,
      data: {
        userId: props?.participant.id + "",
        permission: UserRoleEnum.Host,
        isCoHost: null,
      },
    },
  },
  {
    text: DropdownMenuItemEnum.ReclaimHost,
    role: isCreator.value && props?.participant.role === UserRoleEnum.Host,
    params: {
      type: MemberListEventEnum.Role,
      data: {
        userId: props.localParticipant?.id,
        permission: UserRoleEnum.Host,
        isCoHost: null,
      },
    },
  },
  {
    text: DropdownMenuItemEnum.SetCoHost,
    role:
      isModerator.value &&
      props?.participant.role === UserRoleEnum.Participant &&
      isNotAnonymity.value,
    params: {
      type: MemberListEventEnum.Role,
      data: {
        userId: props?.participant.id,
        permission: UserRoleEnum.CoHost,
        isCoHost: true,
      },
    },
  },
  {
    text: DropdownMenuItemEnum.RemoveCoHost,
    role:
      isNoCreator(props?.participant.id + "") &&
      isModerator.value &&
      props?.participant.role === UserRoleEnum.CoHost,
    params: {
      type: MemberListEventEnum.Role,
      data: {
        userId: props?.participant.id,
        permission: UserRoleEnum.CoHost,
        isCoHost: false,
      },
    },
  },
  {
    text: DropdownMenuItemEnum.MoveToWaitRoom,
    role:
      isHasHost.value &&
      props.participant?.role !== UserRoleEnum.CoHost &&
      props.participant?.role !== UserRoleEnum.Host &&
      isNotAnonymity.value,
    params: {
      type: MemberListEventEnum.MoveToWait,
      data: {
        userId: props?.participant.id,
      },
    },
  },
  {
    text: DropdownMenuItemEnum.RemoveFromMeeting,
    role: isHasHost.value && props?.participant.role !== UserRoleEnum.Host,
    params: {
      type: MemberListEventEnum.Remove,
      data: {
        userId: props?.participant.id,
      },
    },
  },
]);

const isShowDropdown = computed(() => {
  return (
    !props.participant.isLocal &&
    isHasHost.value &&
    (!isModerator.value || isCreator.value) &&
    props.participant.id !== props.meetingInfo.creatorId
  );
});

const isNoCreator = (id: string = "") => {
  return props.meetingInfo?.creatorId + "" !== id + "";
};

const onMute = () =>
  emits("onSelect", {
    type: MemberListEventEnum.Mute,
    data: {
      userId: props?.participant.id,
      isMuted: !props?.participant.isMuted,
    },
  });

const onClick = (item: any) => {
  let message = "",
    title = "",
    confirmButtonText = "確認",
    cancelButtonText = "取消";

  switch (item.text) {
    case DropdownMenuItemEnum.RemoveFromMeeting: {
      message = `確定將${props.participant?.name ?? ""}移出会议？`;
      title = "移除成員";
      confirmButtonText = "移出";
      break;
    }
    default: {
      break;
    }
  }

  if (message) {
    confirm(
      {
        message,
        title,
        confirmButtonText,
        cancelButtonText,
      },
      () => {
        emits("onSelect", item.params);
      },
    );
  } else {
    emits("onSelect", item.params);
  }
};
</script>

<template>
  <div class="member-list-meeting">
    <el-button
      type="primary"
      size="small"
      @click="onMute"
      v-show="participant.isLocal || isHasHost"
    >
      {{ participant.isMuted ? "解除靜音" : "靜音" }}
    </el-button>

    <el-dropdown
      @visible-change="
        (val: boolean) => {
          dropdownVisibleModel = val;

          !val && emits('onDropdown');
        }
      "
      v-show="isShowDropdown"
    >
      <el-button
        size="small"
        @focus="
          (e: any) => {
            e?.target?.blur();
          }
        "
      >
        更多
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <template v-for="(item, index) in dropdownItems" :key="index">
            <el-dropdown-item v-if="item.role" @click="() => onClick(item)">
              {{ item.text }}
            </el-dropdown-item>
          </template>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
