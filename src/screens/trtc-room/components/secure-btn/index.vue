<script setup lang="ts">
import { DataChannelCommand } from "@/entity/enum";
import { useMessage } from "@/hooks/useMessage";
import { useNavigation } from "@/hooks/useNavigation";
import Secure from "@/icon/secure/index.vue";
import ActionBtn from "@/screens/trtc-room/components/action-btn/index.vue";
import { SecurityMenuSubscribeEnum } from "@/screens/trtc-room/props";
import { updateMeetingLock } from "@/services";
import { roomService } from "@/utils/trtc/roomService";
import { useDebounceFn } from "@vueuse/core";
import { computed } from "vue";

const navigation = useNavigation();

const isHost = computed(() => roomService.roomStore.isHasHost);

const isLockEnable = computed(() => roomService.roomStore.isLockEnable);

const isWaitRoomEnable = computed(
  () => roomService.roomStore.isWaitingRoomEnabled,
);

const meeting = computed(() => roomService.roomStore.meeting);

const { messageServices } = useMessage();

const handleCommand = useDebounceFn(
  async (command: SecurityMenuSubscribeEnum) => {
    let tip: string = "",
      message: SecurityMenuSubscribeEnum | null = null;

    try {
      switch (command) {
        case SecurityMenuSubscribeEnum.Lock: {
          await updateMeetingLock({
            meetingId: meeting.value.meetingId,
            isLocked: !isLockEnable.value,
          }).then((res) => {
            tip = res.data?.isLocked
              ? "已鎖定，新成員將無法加入"
              : "已解鎖，新成員將可以加入";

            roomService.roomAction.updateSecureInfo({
              isLockEnabled: res.data?.isLocked ? true : false,
            });

            message = SecurityMenuSubscribeEnum.Lock;
          });

          break;
        }
        case SecurityMenuSubscribeEnum.Wait: {
          await updateMeetingLock({
            meetingId: meeting.value.meetingId,
            isOpenWaitingRoom: !isWaitRoomEnable.value,
          }).then((res) => {
            tip = res.data?.isOpenWaitingRoom ? "已開啟等候室" : "已關閉等候室";

            roomService.roomAction.updateSecureInfo({
              isWaitingRoomEnabled: res.data?.isOpenWaitingRoom ? true : false,
            });

            message = SecurityMenuSubscribeEnum.Wait;
          });

          break;
        }
        default: {
          break;
        }
      }

      roomService.roomAction.publishData({
        command: DataChannelCommand.UpdateSecure,
        message: "",
      });

      messageServices(tip);
    } catch {}
  },
  300,
);
</script>

<template>
  <el-dropdown
    placement="top"
    @command="handleCommand"
    trigger="click"
    v-if="isHost"
  >
    <ActionBtn style="outline: unset" title="安全" icon="">
      <el-icon :size="32">
        <el-icon :size="25"><secure /></el-icon>
      </el-icon>
    </ActionBtn>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item :command="SecurityMenuSubscribeEnum.Lock">
          <div class="dropdown-item" v-checked="isLockEnable">鎖定會議</div>
        </el-dropdown-item>
        <el-dropdown-item :command="SecurityMenuSubscribeEnum.Wait">
          <div class="dropdown-item" v-checked="isWaitRoomEnable">
            開啟等候室
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item) {
  width: 160px;
  height: 32px;
  padding: 0;
  margin: 0 6px;
}

.dropdown-item {
  width: 100%;
  height: 100%;
  padding: 0 8px;
  display: flex;
  align-items: center;
}
</style>
