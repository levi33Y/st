<script setup lang="ts">
import { MeetingStreamMode } from "@/entity/enum";
import { StoreEventEnum, useNavigation } from "@/hooks/useNavigation";
import CloseIcon from "@/icon/close/index.vue";
import { useAppStore } from "@/stores/useAppStore";
import { existsWindow } from "@/utils/utils";
import LogoIcon from "@icon/logo/index.vue";
import { onBeforeMount, ref } from "vue";
import { useRoute } from "vue-router";

const { path, query } = useRoute();

const navigation = useNavigation();

const roomPage = "/trtc-room";

const appStore = useAppStore();

const state = ref({
  meetingNumber: query?.meetingNumber as string,
  meetingTitle: query?.title as string,
  meetingStartDate: query?.startDate as string,
  meetingEndDate: query?.endDate as string,
});

const formatTime = (timestamp: string): string => {
  try {
    const date = new Date(Number(timestamp) * 1000);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "";
  }
};

const onConfirm = async () => {
  if (!query.meetingNumber) {
    return;
  }

  const queryParams = {
    autoAudio: true,
    microphone: false,
    enableCamera: false,
    isDropdownVisible: false,
    isMuted: true,
    userName: appStore?.userName,
    meetingStreamMode: MeetingStreamMode.SFU,
    meetingNumber: query.meetingNumber,
  };

  const isHas = await existsWindow(roomPage);

  if (isHas) {
    navigation.emit(StoreEventEnum.SwitchMeeting, queryParams);
  } else {
    navigation
      .close(`${path}_${query.windowId}`)
      .navigate(roomPage, queryParams);
  }
};

const onCancel = () => {
  navigation.close(`${path}_${query.windowId}`);
};

onBeforeMount(() => {
  state.value.meetingStartDate = formatTime(state.value.meetingStartDate);
  state.value.meetingEndDate = formatTime(state.value.meetingEndDate);
});
</script>

<template>
  <div class="container">
    <div class="header">
      <div>
        <el-icon :size="18"><LogoIcon /></el-icon>
        會議將在3分鐘後開始
      </div>
      <el-icon :size="20" @click="() => onCancel()"><close-icon /></el-icon>
    </div>
    <div class="meeting-info">
      <div>{{ state.meetingTitle }}</div>
      <div>
        會議時間：{{ state.meetingStartDate }}-{{ state.meetingEndDate }}
      </div>
    </div>
    <div class="footer">
      <el-button size="default" @click="() => onCancel()">暫不入會</el-button>
      <el-button size="default" type="primary" @click="() => onConfirm()">
        立即入會
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  padding: var(--spacing-medium);
  border-radius: 10px;
  border: var(--border-width-base) solid var(--border-color-base);
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    & > :first-child {
      display: flex;
      align-items: center;
      column-gap: var(--spacing-smaller);
      font-weight: var(--font-weight-primary);
    }
  }

  .meeting-info {
    display: flex;
    flex-direction: column;
    row-gap: var(--spacing-smaller);

    & > :first-child {
      font-size: var(--font-size-medium);
      font-weight: var(--font-weight-primary);
    }
  }

  .footer {
    display: flex;
    justify-content: end;
  }
}
</style>
