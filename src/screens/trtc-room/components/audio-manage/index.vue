<script setup lang="ts">
import { roomService } from "@/utils/trtc/roomService";
import { CaretTop } from "@element-plus/icons-vue";
import { isNil } from "lodash";
import { computed, onMounted, ref } from "vue";
import MicrophoneIcon from "../../../../components/microphone/index.vue";
import { useAppStore } from "../../../../stores/useAppStore";
import { getMediaDeviceAccessAndStatus } from "../../../../utils/media";
import ActionBtn from "../action-btn/index.vue";

const appStore = useAppStore();

const loading = ref(false);

const isMuted = computed(() => roomService.roomStore?.isMuted ?? true);

const frequency = computed(
  () => roomService.roomStore?.localUser?.outputAudioLevel ?? 0,
);

const onClick = async () => {
  try {
    loading.value = true;

    if (isMuted.value) {
      roomService.mediaManager.setMicrophoneEnabled(true);
    } else {
      roomService.mediaManager.setMicrophoneEnabled(false);
    }
  } finally {
    loading.value = false;
  }
};

const micDevices = computed(() => {
  return roomService.mediaStore.micList;
});

const speakerDevices = computed(() => {
  return roomService.mediaStore.speakerList;
});

const currentMic = computed(() => roomService.mediaStore.mic);

const currentSpeaker = computed(() => roomService.mediaStore.speaker);

const handleDeviceChange = (deviceId: string) => {
  if (micDevices.value.some((item) => item.deviceId == deviceId)) {
    roomService.mediaManager.switchMicDevice(deviceId);
  } else if (speakerDevices.value.some((item) => item.deviceId == deviceId)) {
    roomService.mediaManager.switchSpeakerDevice(deviceId);
  }
};

onMounted(async () => getMediaDeviceAccessAndStatus("microphone"));
</script>

<template>
  <div class="audio-manage">
    <ActionBtn
      v-loading="loading"
      :title="isMuted ? '取消靜音' : '靜音'"
      icon="icon-mic"
      :moderatorDisabled="appStore.isEASpeaking"
      @click="onClick"
    >
      <Microphone-icon
        color="var(--color-text-regular)"
        :size="32"
        :frequency="frequency"
        :isMuted="isMuted"
      />
    </ActionBtn>

    <el-dropdown
      v-if="isNil(roomService.roomStore?.localUser?.screenShareStream)"
      trigger="hover"
      placement="top"
      @command="handleDeviceChange"
      class="device-dropdown"
    >
      <div class="dropdown-icon">
        <el-icon :size="11">
          <CaretTop />
        </el-icon>
      </div>

      <template #dropdown>
        <el-dropdown-menu placement="top-end">
          <div style="margin: 6px">
            <div class="device-divided">
              <el-icon>
                <svg
                  t="1754900663622"
                  class="icon"
                  viewBox="0 0 1024 1024"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="9878"
                  width="200"
                  height="200"
                >
                  <path
                    d="M682.193 329.564c-12.267-12.406-32.245-12.466-44.572-0.182-12.388 12.283-12.448 32.29-0.183 44.632 37.164 37.58 57.627 87.382 57.627 140.224 0 51.808-19.856 100.94-55.806 138.276-12.084 12.528-11.719 32.532 0.79 44.634 6.133 5.9 14.027 8.878 21.922 8.878 8.258 0 16.516-3.222 22.71-9.667 47.426-49.195 73.538-113.894 73.538-182.181-0.12-69.565-27.082-135.117-76.026-184.614z"
                    p-id="9879"
                  ></path>
                  <path
                    d="M776.316 192.685c-13.117-11.492-33.034-10.093-44.512 3.04-11.417 13.135-10.08 33.08 3.036 44.573 79.186 69.199 124.547 169.107 124.547 274.182 0 103.678-44.39 202.673-121.752 271.752-12.995 11.614-14.148 31.56-2.55 44.572 6.253 6.993 14.877 10.58 23.56 10.58 7.47 0 14.939-2.615 20.95-8.027 90.782-80.996 142.884-197.2 142.884-318.877a427.28 427.28 0 0 0-146.163-321.795zM490.878 159.29l-271.622 211.01H109.987v292.428h110.164l270.884 211.01c31.816 24.785 57.591 12.277 57.591-27.92V187.21c0-40.263-25.855-52.697-57.748-27.921z"
                    p-id="9880"
                  ></path>
                </svg>
              </el-icon>
              選擇揚聲器
            </div>
            <el-dropdown-item
              v-for="device in speakerDevices"
              :key="device.deviceId"
              :command="device.deviceId"
            >
              <div
                class="device-name"
                v-checked="device.deviceId == currentSpeaker"
              >
                <div class="device-name-text">
                  {{ device.deviceName }}
                </div>
              </div>
            </el-dropdown-item>
            <div class="device-divided" style="border-top: 1px solid gainsboro">
              <el-icon>
                <svg
                  t="1754899769415"
                  class="icon"
                  viewBox="0 0 1024 1024"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="1506"
                  width="200"
                  height="200"
                >
                  <path
                    d="M770.2 585.2c-21.1-4.3-35.2 8.5-35.9 34.3-2.6 89.5-77.4 166.1-173.4 166.9-31.6 0.3-63.3 0.1-94.9 0-98.7-0.2-173.8-72.1-178.6-170.9-1-19.7-11.5-31.3-28.3-31.2-17.3 0.1-27.8 12.4-27.8 32.8-0.1 101.9 74.3 194.9 177 219.1 23.6 5.6 48.5 6 73.5 8.9V904c-41.4 0-81.8-0.1-122.2 0.1-6.4 0-13 0.7-19.2 2.4-13 3.6-20.6 15.2-19.6 28.5 0.9 12.6 9.8 22.6 22.5 24.7 5.9 1 12 1.4 18 1.4 100 0.1 200.1 0.1 300.1 0 5.6 0 11.2-0.4 16.7-1.2 15.7-2.4 24.9-14.9 23-30.6-2-16.2-13.7-25.1-34.2-25.2-37.2-0.2-74.5-0.1-111.7-0.1h-16c0-18.1 0.4-34.3-0.1-50.5-0.3-8.8 3.4-10.9 11.5-11 15.3-0.3 30.8-0.4 45.8-3 86.2-14.7 146.2-63.4 178.7-143.9 9.7-24 11.9-51 17.6-76.7v-8.4c-4.8-10.8-8.4-22.4-22.5-25.3z"
                    p-id="1507"
                  ></path>
                  <path
                    d="M320.7 477.8c0.6 36.2-1.5 72.9 3.2 108.6C339.1 701 461.6 774.5 571.3 736.6 652.7 708.5 702 638.5 702.4 549c0.4-96.3 0.2-192.7 0-289 0-11.6-0.7-23.3-2.3-34.8-13.4-98.7-103.7-170.6-207-161.6-100.6 8.7-171.4 93-172.3 185.2-0.5 51.6-0.1 103.3-0.1 155h-0.1c0 24.6-0.4 49.3 0.1 74z"
                    p-id="1508"
                  ></path>
                </svg>
              </el-icon>
              選擇麥克風
            </div>
            <el-dropdown-item
              v-for="(device, index) in micDevices"
              :key="device.deviceId"
              :command="device.deviceId"
            >
              <div
                class="device-name"
                v-checked="device.deviceId == currentMic"
              >
                <div class="device-name-text">
                  {{ device.deviceName }}
                </div>
              </div>
            </el-dropdown-item>
          </div>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.audio-manage {
  display: flex;
  column-gap: 2px;
  margin-right: 24px;

  .box-item {
    margin: 0 !important;
  }
}

.dropdown-icon {
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px; // 添加圆角
  transition: all 0.3s ease; // 添加过渡动画

  &:hover {
    outline: none;
    background-color: #d6d6d6; // 聚焦时的背景色
  }
}

.device-name {
  width: 160px !important;
  display: flex;

  .device-name-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.device-divided {
  font-size: 14px;
  padding-top: 4px;
  color: gainsboro;
  display: flex;
  align-items: center;
  column-gap: 1px;
  margin: 2px 0;
}

::v-deep(.dropdown-icon) {
  &:focus {
    outline: none;
  }
}
</style>
