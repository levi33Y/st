<script setup lang="ts">
import { computed } from "vue";
import { MeetingPermissionEnum } from "../../services/apis/meeting/types";
import { useAppStore } from "../../stores/useAppStore";
import { useMeetingStore } from "../../stores/useMeetingStore";
import {
  IDataEventProps,
  MeetingParticipant,
  MemberListEventEnum,
} from "./props";

const appStore = useAppStore();

const meetingStore = useMeetingStore();

const dropdownVisibleModel = defineModel<boolean>({ default: false });

const props = defineProps<{
  participant: MeetingParticipant;
}>();

const emits = defineEmits<{
  (event: "onSelect", data: IDataEventProps): void;
  (event: "onDropdown"): void;
}>();

const isEdit = computed(
  () =>
    !props?.participant.isLocal &&
    meetingStore.getRole(appStore.userInfo.id + "") &&
    (props?.participant.role !== MeetingPermissionEnum.Host ||
      meetingStore.isCreator(appStore.userInfo.id + "")),
);

const dropdownItems = computed(() => [
  {
    text: "設為主持人",
    role:
      meetingStore.isModerator(appStore.userInfo.id + "") &&
      props?.participant.role !== MeetingPermissionEnum.Host,
    params: {
      type: MemberListEventEnum.Role,
      data: {
        userId: props?.participant.id + "",
        permission: MeetingPermissionEnum.Host,
        isCoHost: null,
      },
    },
  },
  {
    text: "收回主持人",
    role:
      meetingStore.isCreator(appStore.userInfo.id + "") &&
      props?.participant.role === MeetingPermissionEnum.Host,
    params: {
      type: MemberListEventEnum.Role,
      data: {
        userId: appStore.userInfo.id + "",
        permission: MeetingPermissionEnum.Host,
        isCoHost: null,
      },
    },
  },
  {
    text: "設為聯席主持人",
    role:
      meetingStore.isModerator(appStore.userInfo.id + "") &&
      !props?.participant.role,
    params: {
      type: MemberListEventEnum.Role,
      data: {
        userId: props?.participant.id,
        permission: MeetingPermissionEnum.CoHost,
        isCoHost: true,
      },
    },
  },
  {
    text: "撤銷聯席主持人",
    role:
      !meetingStore.isCreator(props?.participant.id + "") &&
      meetingStore.isModerator(appStore.userInfo.id + "") &&
      props?.participant.role === MeetingPermissionEnum.CoHost,
    params: {
      type: MemberListEventEnum.Role,
      data: {
        userId: props?.participant.id,
        permission: MeetingPermissionEnum.CoHost,
        isCoHost: false,
      },
    },
  },
  {
    text: "移除會議",
    role:
      meetingStore.getRole(appStore.userInfo.id + "") &&
      props?.participant.role !== MeetingPermissionEnum.Host,
    params: {
      type: MemberListEventEnum.Remove,
      data: {
        id: props?.participant.id,
      },
    },
  },
]);
</script>

<template>
  <div class="member-list-meeting">
    <el-button
      type="primary"
      size="small"
      @click="
        emits('onSelect', {
          type: MemberListEventEnum.Mute,
          data: {
            id: participant.id,
            isMuted: !participant.isMuted,
          },
        })
      "
      v-show="participant.isLocal || isEdit"
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
      v-show="isEdit"
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
            <el-dropdown-item
              v-if="item.role"
              @click="
                () => {
                  emits('onSelect', item.params);
                }
              "
            >
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
