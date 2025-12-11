<script setup lang="ts">
import EditSvg from "@/icon/edit/index.vue";
import WarringSvg from "@/icon/warring/index.vue";
import Avatar from "@components/avatar/index.vue";
import { computed, reactive } from "vue";
import { MeetingPermissionEnum } from "../../services/apis/meeting/types";
import { useAppStore } from "../../stores/useAppStore";
import { useMeetingStore } from "../../stores/useMeetingStore";
import {
  IDataEventProps,
  IDialogFormStateProps,
  MeetingParticipant,
  MemberListEventEnum,
} from "./props";

const props = defineProps<{
  isEdit: boolean;
  participant: MeetingParticipant;
}>();

const emits = defineEmits<{
  (event: "onSubmit", data: IDataEventProps): void;
}>();

const meetingStore = useMeetingStore();

const appStore = useAppStore();

const dialogState = reactive<IDialogFormStateProps>({
  dialogVisible: false,
  name: "",
});

const isEditName = computed(
  () =>
    appStore.userInfo.id + "" == props.participant.id ||
    meetingStore.getRole(appStore.userInfo.id + ""),
);

const onEdit = () => {
  dialogState.dialogVisible = true;

  dialogState.name = props?.participant?.nick ?? "";
};

const onSubmit = () => {
  emits("onSubmit", {
    type: MemberListEventEnum.ChangeName,
    data: {
      id: props.participant.id,
      name: dialogState.name,
    },
  });

  dialogState.dialogVisible = false;
};
</script>

<template>
  <Avatar :size="36" :name="participant.nick" />
  <div class="member-list-avatar">
    <span class="text-name">
      {{ participant.nick ?? "" }}
      <EditSvg v-if="isEditName" @click="() => onEdit()" v-show="isEdit" />
    </span>
    <p v-if="participant.role || participant.isLocal">
      ({{
        participant.role === MeetingPermissionEnum.Host
          ? "主持人"
          : participant.role === MeetingPermissionEnum.CoHost
          ? "聯席主持人"
          : ""
      }}
      <span v-if="participant.role && participant.isLocal">，</span>
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
