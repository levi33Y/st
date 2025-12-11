<script setup lang="ts">
import { ArrowDown } from "@element-plus/icons-vue";
import { computed } from "vue";
import { MeetingPermissionEnum } from "../../services/apis/meeting/types";
import { useAppStore } from "../../stores/useAppStore";
import { useMeetingStore } from "../../stores/useMeetingStore";
import { ISetMemberRoleDataProps, MeetingParticipant } from "./props";

const appStore = useAppStore();

const meetingStore = useMeetingStore();

const dropdownVisibleModel = defineModel<boolean>({ default: false });

const props = defineProps<{
  participant: MeetingParticipant;
}>();

const emits = defineEmits<{
  (event: "onSelect", data: ISetMemberRoleDataProps): void;
  (event: "onDropdown"): void;
}>();

const localRole = computed(() =>
  meetingStore.getRole(appStore.userInfo.id + ""),
);

const isCreator = computed(() =>
  meetingStore.isCreator(appStore.userInfo.id + ""),
);

const isModerator = computed(() =>
  meetingStore.isModerator(appStore.userInfo.id + ""),
);

const isEdit = computed(
  () =>
    !props?.participant.isLocal &&
    localRole &&
    (props?.participant.role !== MeetingPermissionEnum.Host || isCreator.value),
);
</script>

<template>
  <div class="member-list-wait">
    <el-dropdown
      @visible-change="
        (val: boolean) => {
          dropdownVisibleModel = val;

          !val && emits('onDropdown');
        }
      "
      placement="bottom-end"
    >
      <el-button
        color="#626aef"
        plain
        @focus="
          (e: any) => {
            e?.target?.blur();
          }
        "
      >
        准入
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item>本次會議自動加入</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-button link plain>移除</el-button>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
