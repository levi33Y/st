<script setup lang="ts">
import { StoreEventEnum, useNavigation } from "@/hooks/useNavigation";
import { SecurityMenuSubscribeEnum } from "@/screens/trtc-room/props";
import { updateMeetingLock } from "@/services";
import { useDebounceFn } from "@vueuse/core";
import { isNil } from "lodash";
import { onMounted, reactive } from "vue";
import { useRoute } from "vue-router";

const navigation = useNavigation();

const { query } = useRoute();

const state = reactive<{
  isLocked: boolean;
  isOpenWaitingRoom: boolean;
}>({
  isLocked: false,
  isOpenWaitingRoom: false,
});

const onSendCommand = useDebounceFn(
  async (command: SecurityMenuSubscribeEnum) => {
    if (!query?.meetingId) {
      console.warn("meeting info is null");
    }

    const meetingId = query.meetingId as string;

    switch (command) {
      case SecurityMenuSubscribeEnum.Lock: {
        await updateMeetingLock({
          meetingId: meetingId,
          isLocked: !state.isLocked,
        }).then((res) => {
          if (isNil(res.data?.isLocked)) {
            return;
          }

          state.isLocked = res.data.isLocked;

          navigation.emit(StoreEventEnum.UpdateMeetingSecure, res.data);
        });

        break;
      }
      case SecurityMenuSubscribeEnum.Wait: {
        await updateMeetingLock({
          meetingId: meetingId,
          isOpenWaitingRoom: !state.isOpenWaitingRoom,
        }).then((res) => {
          if (isNil(res.data?.isOpenWaitingRoom)) {
            return;
          }

          state.isOpenWaitingRoom = res.data.isOpenWaitingRoom;

          navigation.emit(StoreEventEnum.UpdateMeetingSecure, res.data);
        });
      }
      default: {
        break;
      }
    }
  },
  300,
);

const updateMeeting = () => {
  updateMeetingLock({
    meetingId: query.meetingId as string,
  }).then((res) => {
    state.isOpenWaitingRoom = res?.data?.isOpenWaitingRoom ?? false;

    state.isLocked = res?.data?.isLocked ?? false;
  });
};

onMounted(() => {
  updateMeeting();

  navigation.on(StoreEventEnum.UpdateMeetingSecure, () => {
    updateMeeting();
  });
});
</script>

<template>
  <div class="container">
    <div
      class="menu-item"
      v-checked="state.isLocked"
      @click="onSendCommand(SecurityMenuSubscribeEnum.Lock)"
    >
      鎖定會議
    </div>
    <div
      class="menu-item"
      v-checked="state.isOpenWaitingRoom"
      @click="onSendCommand(SecurityMenuSubscribeEnum.Wait)"
    >
      開啟等候室
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  font-size: 14px;
  padding: 6px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  row-gap: 2px;

  .menu-item {
    width: 100%;
    height: 32px;
    padding: 5px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    &:hover {
      background-color: #eef0ff;
      color: #475aec;
    }
  }
}
</style>
