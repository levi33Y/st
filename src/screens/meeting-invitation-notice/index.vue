<script setup lang="ts">
import { MeetingStreamMode } from "@/entity/enum";
import { StoreEventEnum, useNavigation } from "@/hooks/useNavigation";
import CloseIcon from "@/icon/close/index.vue";
import { inviteUpdate } from "@/services";
import { InvitationStatusEnum } from "@/services/apis/meeting/types";
import { useAppStore } from "@/stores/useAppStore";
import { existsWindow } from "@/utils/utils";
import Avatar from "@components/avatar/index.vue";
import { useDebounceFn } from "@vueuse/core";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const roomPage = "/trtc-room";

const { path, query } = useRoute();

const navigation = useNavigation();

const appStore = useAppStore();

const state = ref({
  id: query?.id as string,
  meetingId: query?.meetingId as string,
  meetingSubId: query?.meetingSubId as string,
  invitingPeople: query?.invitingPeople as string,
  meetingTitle: query?.meetingTitle as string,
  meetingNumber: query?.meetingNumber as string,
  invitingPeopleAvatarUrl: query?.invitingPeopleAvatarUrl as string,
});

const clickDisabled = ref(true);

const updateInvitationStatus = async (
  status: InvitationStatusEnum,
  maxRetries: number = 3,
) => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await inviteUpdate({
        meetingInvitationRecords: [
          {
            id: Number(state.value.id),
            invitationStatus: status,
          },
        ],
      });
      return result;
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw lastError;
};

const onConfirm = useDebounceFn(async () => {
  try {
    clickDisabled.value = true;

    if (!query?.meetingNumber) {
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
      meetingNumber: query?.meetingNumber,
    };

    const isHas = await existsWindow(roomPage);

    if (isHas) {
      navigation.emit(StoreEventEnum.SwitchMeeting, queryParams);
    } else {
      await updateInvitationStatus(InvitationStatusEnum.Accepted);
    }

    navigation
      .close(`${path}_${query?.windowId}`)
      .navigate(roomPage, queryParams);
  } finally {
    clickDisabled.value = false;
  }
}, 300);

const onCancel = useDebounceFn(async () => {
  try {
    clickDisabled.value = true;

    await updateInvitationStatus(InvitationStatusEnum.Declined);

    navigation.destroy(`${path}_${query?.windowId}`);
  } finally {
    clickDisabled.value = false;
  }
}, 300);

onMounted(async () => {
  try {
    const isHas = await existsWindow(roomPage);

    if (isHas) {
      await updateInvitationStatus(InvitationStatusEnum.InCall);
    }
  } catch {
  } finally {
    clickDisabled.value = false;
  }
});
</script>

<template>
  <div class="container">
    <div class="header">
      <div class="header-invite-info">
        <Avatar
          :size="50"
          :font-size="28"
          :name="state?.invitingPeople"
          :src="state?.invitingPeopleAvatarUrl"
        />
        <div class="header-meeting-info">
          <div>{{ state?.invitingPeople }}邀請你參加</div>
          <div>{{ state?.meetingTitle }}</div>
        </div>
      </div>
      <el-icon v-if="!clickDisabled" :size="20" @click="() => onCancel()">
        <close-icon />
      </el-icon>
    </div>
    <div class="footer">
      <el-button
        size="default"
        :disabled="clickDisabled"
        @click="() => onCancel()"
      >
        暫不入會
      </el-button>
      <el-button
        size="default"
        type="primary"
        :disabled="clickDisabled"
        @click="() => onConfirm()"
      >
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
    align-items: start;
    justify-content: space-between;

    .header-invite-info {
      display: flex;
      column-gap: var(--spacing-smaller);

      .header-meeting-info {
        padding: var(--spacing-tiny) 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        row-gap: var(--spacing-sm);

        & > :nth-child(2) {
          font-size: var(--font-size-extra-large);
          font-weight: var(--font-weight-primary);
        }
      }
    }
  }

  .footer {
    display: flex;
    justify-content: end;
  }
}
</style>
