<script setup lang="ts">
import { StoreEventEnum, useNavigation } from "@/hooks/useNavigation";
import { useSettingsStore } from "@/stores/useSettingsStore";
import emitter, { TRTCSDKEnum } from "@/utils/trtc/hook/useMitt";
import { roomService } from "@/utils/trtc/roomService";
import Header from "@components/header/index.vue";
import { isNil } from "lodash";
import { onMounted, ref, watch } from "vue";
import ConferenceMainView from "./components/conference-main-view/index.vue";
import ConferenceSkeleton from "./components/conference-skeleton/index.vue";

const settingsStore = useSettingsStore();

const isReady = ref(false);

const navigation = useNavigation();

const roomPage = "/trtc-room";

const initWindowSize = () => {
  window.windowControl.setSize(roomPage, {
    width: 960,
    height: 640,
    minWidth: 960,
    minHeight: 640,
    animate: true,
  });
};

navigation.emit(StoreEventEnum.RoomPageReady);

watch(
  () => roomService.roomStore?.localUser?.status,
  () => {
    initWindowSize();
  },
);

emitter.emit(TRTCSDKEnum.INIT);

emitter.on(TRTCSDKEnum.Ready, (data) => {
  roomService.bind(data, (err) => {
    !err && (isReady.value = true);
  });
});

onMounted(() => {
  initWindowSize();

  roomService.bindAppSetting(settingsStore);
});
</script>

<template>
  <div
    :class="[
      'container',
      isNil(roomService?.roomStore?.shareScreenUser) && 'room-border',
    ]"
  >
    <div v-if="!isReady">
      <Header
        :hideMinimizable="true"
        :hide-maximizable="true"
        style="background-color: white"
      />
      <conference-skeleton />
    </div>
    <conference-main-view v-else />
  </div>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 10px;
}

.room-border {
  border: var(--border-width-base) solid var(--border-color-base);
}
</style>
