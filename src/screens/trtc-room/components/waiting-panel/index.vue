<script lang="ts" setup>
import EditSvg from "@/icon/edit/index.vue";
import WarringSvg from "@/icon/warring/index.vue";
import { IMeetingUserSessionsProps } from "@/services/apis/meeting/types";
import { roomService } from "@/utils/trtc/roomService";
import { ElMessage } from "element-plus";
import { computed, reactive, ref, watch } from "vue";
import WaitingPanelAudio from "./waiting-panel-audio.vue";
import WaitingPanelVideo from "./waiting-panel-video.vue";

const props = defineProps<{
  meetingUserSessions: IMeetingUserSessionsProps[];
}>();

const reJoinMeeting = ref<{
  isOpenCamera: boolean;
  isMuted: boolean;
}>({
  isOpenCamera: false,
  isMuted: true,
});

const emits = defineEmits<{
  (event: "leaveMeeting"): void;
}>();

const dialogState = reactive({
  dialogVisible: false,
  name: "",
});

const meeting = computed(() => roomService.roomStore?.meeting);

const localUser = computed(() => roomService?.roomStore?.localUser);

const title = computed(() => {
  const isHasHost = props.meetingUserSessions?.some(
    (user) => user.isMeetingMaster,
  );

  return isHasHost ? "請稍等,主持人即將邀請您入會" : "會議未開始";
});

const onEdit = () => {
  dialogState.dialogVisible = true;

  dialogState.name = localUser.value?.nick ?? "";
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

  roomService.userManager.updateNickName(dialogState.name);

  dialogState.dialogVisible = false;
};

watch(
  () => reJoinMeeting.value,
  () => {
    roomService.roomAction.updateMeetingSettingInfo({
      cameraEnable: reJoinMeeting.value?.isOpenCamera,
      microphoneEnable: !reJoinMeeting.value?.isMuted,
    });
  },
  {
    deep: true,
  },
);
</script>

<template>
  <div class="waiting-room">
    <div class="content">
      <h1 class="title">{{ title }}</h1>

      <div class="meeting-info-item">
        <div class="diamond" />
        <div class="info-label">會議主題</div>
        <div class="info-value">{{ meeting.meetingTitle }}</div>
      </div>

      <div class="meeting-info-item">
        <div class="diamond"></div>
        <div class="info-label">參會姓名</div>
        <div class="info-value">{{ localUser.nick ?? "" }}</div>
        <div>
          <el-icon :size="22">
            <EditSvg @click="() => onEdit()" />
          </el-icon>
        </div>
      </div>

      <div class="actions">
        <div class="action-item">
          <WaitingPanelAudio v-model="reJoinMeeting.isMuted" />
        </div>

        <div class="action-item">
          <WaitingPanelVideo v-model="reJoinMeeting.isOpenCamera" />
        </div>
      </div>
    </div>
    <el-button class="leave-button" link @click="() => emits('leaveMeeting')">
      離開會議
    </el-button>
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

<style lang="scss" scoped>
.waiting-room {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #29375a 0%, #0b152e 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .content {
    text-align: center;
    color: #fff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: start;
    width: 360px;

    .title {
      font-weight: 600;
      font-size: 27px;
      color: #ffffff;
      line-height: 28px;
      text-align: center;
      font-style: normal;
      text-transform: none;
    }

    .meeting-info-item {
      display: flex;
      align-items: center;

      div {
        height: 30px;
        display: flex;
        align-items: center;
        font-weight: 400;
        font-size: 14px;
        color: #ffffff;
        line-height: 21px;
        text-align: center;
        font-style: normal;
        text-transform: none;
      }

      .diamond {
        width: 5px;
        height: 5px;
        margin-right: 10px;
        background-color: white;
        transform: rotate(45deg);
      }

      .info-label {
        margin-right: 15px;
      }

      .info-value {
        margin-right: 5px;
      }
    }

    .actions {
      display: flex;
      column-gap: 30px;
      justify-content: center;
      margin-top: 80px;

      .action-item {
        display: flex;
        row-gap: 10px;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    }
  }

  .leave-button {
    margin-top: 130px;
    color: #f3333e;

    &:hover {
      color: #f3333e;
    }
  }
}
</style>
