<script setup lang="ts">
import { confirm } from "@/screens/trtc-room/components/member-list/utlis";
import { ArrowDown } from "@element-plus/icons-vue";
import {
  IDataEventProps,
  IManagementMemberProps,
  MemberListEventEnum,
} from "./props";

const dropdownVisibleModel = defineModel<boolean>({ default: false });

const props = defineProps<{
  participant: IManagementMemberProps;
}>();

const emits = defineEmits<{
  (event: "onSelect", data: IDataEventProps): void;
  (event: "onDropdown"): void;
}>();

const onCommand = (command: MemberListEventEnum) => {
  let message = "",
    title = "",
    confirmButtonText = "確認",
    cancelButtonText = "取消";

  switch (command) {
    case MemberListEventEnum.AutoAccess: {
      message = `自動准入後，該成員在本場會議中將跳過等候室直接入會。`;
      title = "自動准入該成員";
      break;
    }
    case MemberListEventEnum.RemoveWait: {
      message = `確定將${props.participant?.name ?? ""}移出等候室？`;
      title = "移除等候成員";
      confirmButtonText = "移出";
      break;
    }
    default: {
      break;
    }
  }

  const data = {
    ...props.participant,
    userId: props.participant.id,
  };

  if (message) {
    confirm(
      {
        message,
        title,
        confirmButtonText,
        cancelButtonText,
      },
      () => {
        emits("onSelect", {
          type: command,
          data: data,
        });
      },
    );
  } else {
    emits("onSelect", {
      type: command,
      data: data,
    });
  }
};
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
      @command="(command:MemberListEventEnum)=>onCommand(command)"
    >
      <el-button
        color="#626aef"
        plain
        @focus="
          (e: any) => {
            e?.target?.blur();
          }
        "
        @click="() => onCommand(MemberListEventEnum.Access)"
      >
        准入
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item :command="MemberListEventEnum.AutoAccess">
            本次會議自動加入
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-button link plain @click="onCommand(MemberListEventEnum.RemoveWait)">
      移除
    </el-button>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
