import { defineStore } from "pinia";
import loudness from "../utils/loudness";
import manageDevices from "../utils/manage-devices";

export const useSettingsStore = defineStore("settingsStore", {
  state: (): {
    // 入会开启摄像头
    enableCamera: boolean;
    // 入会开启麦克风
    enableMicrophone: boolean;
    // 显示参会时长
    showMeetingDuration: boolean;
    // 系统输出音量
    volume: number;
    // 系统是否静音
    muted: boolean;
    // 音频输出设备ID
    audioOutputDeviceId: string;
    // 音频输入设备ID
    audioInputDeviceId: string;
    // 音频输出设备
    audioOutputDevice?: MediaDeviceInfo;
    // 音频输入设备
    audioInputDevice?: MediaDeviceInfo;
    // 共享虚拟音频线路
    virtualAudioLine?: MediaDeviceInfo;
    // 是否开启 DevTools
    openDevTools: boolean;
    // 是否开启水印
    enableWatermark: boolean;
    // 是否开启MCU模式
    enableMCU: boolean;
    // 是否开启滤镜
    enableFilter: boolean;
    // 录制保存路径
    recordSavePath: string;
  } => ({
    enableCamera: false,
    enableMicrophone: false,
    showMeetingDuration: true,
    volume: 0,
    muted: false,
    audioOutputDeviceId: "default",
    audioInputDeviceId: "default",
    openDevTools: false,
    enableWatermark: false,
    enableMCU: false,
    enableFilter: true,
    recordSavePath: "",
  }),
  actions: {
    async initRecordSavePath() {
      if (!this.recordSavePath) {
        try {
          const defaultPath = await window.fileSystem.getDefaultRecordPath();

          this.recordSavePath = defaultPath;

          await window.fileSystem.setRecordSavePath(defaultPath);
        } catch {}
      } else {
        try {
          await window.fileSystem.setRecordSavePath(this.recordSavePath);
        } catch {}
      }
    },
    async init() {
      loudness.getStatus().then(([volume, muted]) => {
        this.volume = volume;
        this.muted = muted;
      });

      await this.initRecordSavePath();
    },
    async setRecordSavePath(path: string) {
      this.recordSavePath = path;
      try {
        await window.fileSystem.setRecordSavePath(path);
      } catch {}
    },
    async handleUpdateAudioDevice() {
      const inputDevices = await manageDevices.getAudioInputDevices();

      const outDevices = await manageDevices.getAudioOutputDevices();

      if (
        !inputDevices.some(
          (item) => item.deviceId === this.audioInputDeviceId,
        ) ||
        this.audioInputDeviceId === "default"
      ) {
        const defaultDevice = await manageDevices.getAudioDefaultInputDevice();

        this.audioInputDevice = defaultDevice ?? ({} as MediaDeviceInfo);

        this.audioInputDeviceId = defaultDevice?.deviceId as string;
      }

      if (
        !outDevices.some(
          (item) => item.deviceId === this.audioOutputDeviceId,
        ) ||
        this.audioOutputDeviceId === "default"
      ) {
        const defaultDevice = await manageDevices.getAudioDefaultOutputDevice();

        this.audioOutputDevice = defaultDevice ?? ({} as MediaDeviceInfo);

        this.audioOutputDeviceId = defaultDevice?.deviceId as string;
      }
    },
  },
  persist: true,
});
