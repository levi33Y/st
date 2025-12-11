import {
  ScreenRecordingResolutionConst,
  ScreenRecordingResolutionEnum,
} from "@/services/apis/trtc/types";
import { isNil } from "lodash";
import { defineStore } from "pinia";
import { TRTCDeviceInfo } from "trtc-electron-sdk";

interface IMediaStoreStateProps {
  videoResolution: ScreenRecordingResolutionEnum;
  currentMicInfo: TRTCDeviceInfo;
  currentSpeakerInfo: TRTCDeviceInfo;
  currentCameraInfo: TRTCDeviceInfo;
  micDevicesListInfo: TRTCDeviceInfo[];
  SpeakerDevicesListInfo: TRTCDeviceInfo[];
  CameraDevicesListInfo: TRTCDeviceInfo[];
}

export const useMediaStore = defineStore("MediaStore", {
  state: (): IMediaStoreStateProps => ({
    videoResolution: ScreenRecordingResolutionEnum.Medium,
    currentMicInfo: {} as TRTCDeviceInfo,
    currentSpeakerInfo: {} as TRTCDeviceInfo,
    currentCameraInfo: {} as TRTCDeviceInfo,
    micDevicesListInfo: [],
    SpeakerDevicesListInfo: [],
    CameraDevicesListInfo: [],
  }),
  actions: {
    updateVideoResolution(resolution: ScreenRecordingResolutionEnum) {
      if (!isNil(resolution) && ScreenRecordingResolutionConst[resolution]) {
        this.videoResolution = resolution;
      }
    },
    updateCurrentMicInfo(info: TRTCDeviceInfo) {
      this.currentMicInfo = info;
    },
    updateCurrentSpeakerInfo(info: TRTCDeviceInfo) {
      this.currentSpeakerInfo = info;
    },
    updateCurrentCameraInfo(info: TRTCDeviceInfo) {
      this.currentCameraInfo = info;
    },
    updateMicDevicesListInfo(list: TRTCDeviceInfo[]) {
      this.micDevicesListInfo = list;
    },
    updateSpeakerDevicesListInfo(list: TRTCDeviceInfo[]) {
      this.SpeakerDevicesListInfo = list;
    },
    updateCameraDevicesListInfo(list: TRTCDeviceInfo[]) {
      this.CameraDevicesListInfo = list;
    },
  },
  getters: {
    mic(state) {
      return state.currentMicInfo.deviceId;
    },
    speaker(state) {
      return state.currentSpeakerInfo.deviceId;
    },
    camera(state) {
      return state.currentCameraInfo.deviceId;
    },
    micList(state) {
      return state.micDevicesListInfo;
    },
    speakerList(state) {
      return state.SpeakerDevicesListInfo;
    },
    cameraList(state) {
      return state.CameraDevicesListInfo;
    },
    videoResolutionParamArg(state) {
      return ScreenRecordingResolutionConst[state.videoResolution];
    },
  },
  persist: true,
});
