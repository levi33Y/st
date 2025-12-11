<script setup lang="ts">
import EditSvg from "@/icon/edit/index.vue";
import WarringSvg from "@/icon/warring/index.vue";
import { IUserInfoProps, UserRoleEnum } from "@/utils/trtc/store/room";
import Avatar from "@components/avatar/index.vue";
import { ElMessage } from "element-plus";
import { computed, reactive } from "vue";
import { useAppStore } from "../../../../stores/useAppStore";
import {
  IDataEventProps,
  IDialogFormStateProps,
  IManagementMemberProps,
  MemberListEventEnum,
} from "./props";

const props = defineProps<{
  isEdit: boolean;
  participant: IManagementMemberProps;
  localParticipant: IUserInfoProps;
}>();

const emits = defineEmits<{
  (event: "onSubmit", data: IDataEventProps): void;
}>();

const appStore = useAppStore();

const dialogState = reactive<IDialogFormStateProps>({
  dialogVisible: false,
  name: "",
});

const isHasHotHost = computed(() => {
  return (
    props.localParticipant?.role === UserRoleEnum.CoHost ||
    props.localParticipant?.role === UserRoleEnum.Host
  );
});

const isEditName = computed(
  () => appStore.userInfo.id + "" == props.participant.id || isHasHotHost.value,
);

const roleName = computed(() => {
  return props?.participant?.role === UserRoleEnum.Host
    ? "主持人"
    : props?.participant?.role === UserRoleEnum.CoHost
    ? "聯席主持人"
    : "";
});

const onEdit = () => {
  dialogState.dialogVisible = true;

  dialogState.name = props?.participant?.nick ?? "";
};

const onSubmit = () => {
  const newName = dialogState.name?.trim();

  if (!newName) {
    ElMessage({
      message: "名称不能为空",
      type: "warning",
    });
    return;
  }

  emits("onSubmit", {
    type: MemberListEventEnum.ChangeName,
    data: {
      userId: props.participant.id,
      name: dialogState.name,
    },
  });

  dialogState.dialogVisible = false;
};
</script>

<template>
  <Avatar :size="36" :name="participant.nick" :src="participant?.avatarUrl" />
  <div class="member-list-avatar">
    <span class="text-name">
      {{ participant.nick ?? "" }}
      <el-icon size="16" color="var(--el-color-primary)">
        <EditSvg @click="() => onEdit()" v-show="isEdit && isEditName" />
      </el-icon>
    </span>
    <p v-if="roleName || participant.isLocal">
      ({{ roleName }}
      <span
        v-if="
          participant.role !== UserRoleEnum.Participant && participant.isLocal
        "
      >
        ，
      </span>
      <span v-if="participant.isLocal">我</span>
      )
    </p>
  </div>

  <el-dialog
    class="dialog-container"
    v-model="dialogState.dialogVisible"
    width="350"
    align-center
  >
    <template #header>
      <div class="dialog-header">
        <warring-svg />
        修改名称
      </div>
    </template>
    <div class="dialog-content">
      <el-input
        v-model="dialogState.name"
        type="text"
        maxlength="15"
        placeholder="請輸入名稱"
      />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogState.dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="() => onSubmit()">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@use "index";
</style>
