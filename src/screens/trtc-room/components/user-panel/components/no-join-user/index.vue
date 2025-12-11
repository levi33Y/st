<template>
  <div class="user-item-container">
    <div class="user-item-content">
      <div class="avatar-wrapper">
        <Avatar
          :size="72"
          :font-size="36"
          :name="participant?.name"
          :src="participant?.avatarUrl"
        />
        <div class="status-overlay">
          <div v-if="isNil(statusText)" class="status-icon" @click="onCall">
            <el-icon :size="48" color="white">
              <PhoneIcon />
            </el-icon>
          </div>

          <div v-else class="status-text">
            {{ statusText }}
          </div>
        </div>
      </div>
      <div class="user-info">
        <span class="title">{{ participant?.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inviteCreate } from "@/services";
import {
  InvitationStatusEnum,
  InvitationStatusTextConst,
} from "@/services/apis/meeting/types";
import { roomService } from "@/utils/trtc/roomService";
import { IUserInfoProps } from "@/utils/trtc/store/room";
import { useDebounceFn } from "@vueuse/core";
import { ElMessage } from "element-plus";
import { isNil } from "lodash";
import { ref, watch } from "vue";
import Avatar from "../../../../../../components/avatar/index.vue";
import PhoneIcon from "../../../../../../icon/round-phone/index.vue";

const props = defineProps<{
  participant: Partial<IUserInfoProps>;
}>();

const statusText = ref<string | null>(null);

watch(
  () => props.participant?.invitationStatus,
  (sub, pre) => {
    if (
      (isNil(pre) && sub !== InvitationStatusEnum.InvitationPending) ||
      isNil(sub)
    ) {
      statusText.value = null;
    } else if (pre === InvitationStatusEnum.InvitationPending) {
      const timeLimit = sub === InvitationStatusEnum.Accepted ? 60000 : 3000;

      statusText.value = InvitationStatusTextConst[sub];

      setTimeout(() => {
        statusText.value = null;
      }, timeLimit);
    } else if (sub === InvitationStatusEnum.InvitationPending) {
      statusText.value = InvitationStatusTextConst[sub];
    }
  },
  {
    immediate: true,
  },
);

const onCall = useDebounceFn(async () => {
  statusText.value =
    InvitationStatusTextConst[InvitationStatusEnum.InvitationPending];

  const res = await inviteCreate({
    meetingId: roomService.roomStore.meeting?.meetingId,
    meetingSubId: roomService.roomStore.meeting?.meetingSubId,
    names: [props.participant?.name ?? ""],
  });

  if (res.code !== 200) {
    ElMessage.error("呼叫失败");

    statusText.value = null;
  }
}, 300);
</script>

<style scoped lang="scss">
.user-item-container {
  position: relative;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;

  .user-item-video {
    position: relative;
    width: 100%;
    .user-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    #myVideo {
      height: 100%;
      width: 100%;
      transform: scaleX(-1);
    }

    .user-info {
      position: absolute;
      bottom: var(--spacing-tiny);
      left: var(--spacing-tiny);
      display: flex;
      align-items: center;
      padding: var(--spacing-tiny);
      background-color: var(--background-color-popup);
      border-radius: var(--border-radius-base);

      .title {
        font-size: var(--font-size-small);
        color: var(--color-text-white);
      }

      .mic-mute-status {
        position: relative;
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #146fff;
        border-radius: 50%;
        overflow: hidden;
        margin-left: var(--spacing-tiny);

        &.disabled::after {
          content: "";
          position: absolute;
          top: 1px;
          left: calc(50% - 1px);
          width: 1px;
          bottom: 1px;
          background-color: var(--color-danger);
          transform-origin: center;
          transform: rotate(45deg);
        }
      }
    }
  }

  .user-item-content {
    position: relative;
    width: 148px;
    height: 148px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2;

    .user-info {
      display: flex;
      align-items: center;
      margin-top: 8px;
      column-gap: var(--spacing-small);

      .title {
        font-size: var(--font-size-small);
      }

      .mic-mute-status {
        position: relative;
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #146fff;
        border-radius: 50%;
        overflow: hidden;
        margin-left: var(--spacing-tiny);

        &.disabled::after {
          content: "";
          position: absolute;
          top: 1px;
          left: calc(50% - 1px);
          width: 1px;
          bottom: 1px;
          background-color: var(--color-danger);
          transform-origin: center;
          transform: rotate(45deg);
        }
      }
    }
  }

  .user-item-active {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border: 2px solid var(--color-success);
  }

  .avatar-wrapper {
    position: relative;
    display: inline-block;
  }

  .status-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-text {
    color: white;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
  }

  .status-icon {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
