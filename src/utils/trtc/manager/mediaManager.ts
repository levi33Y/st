import {
  ScreenRecordingResolutionConst,
  ScreenRecordingResolutionEnum,
} from "@/services/apis/trtc/types";
import { getMediaDeviceAccessAndStatus } from "@/utils/media";
import { IRoomServiceProps, RoomEventEnum } from "@/utils/trtc/roomService";
import { ArmsBehaviorEnum, armsService } from "@components/arms/ArmsService";
import { isNil } from "lodash";
import {
  Rect,
  TRTCScreenCaptureProperty,
  TRTCScreenCaptureSourceInfo,
  TRTCVideoEncParam,
  TRTCVideoStreamType,
} from "trtc-electron-sdk";

export interface IIMediaManagerProps {}

export class MediaManager implements IIMediaManagerProps {
  private service: IRoomServiceProps;

  constructor(service: IRoomServiceProps) {
    this.service = service;
  }

  mute() {
    this.setMicrophoneEnabled(true);
  }

  turnMicrophone() {
    this.setMicrophoneEnabled(false);
  }

  setVideoResolution(resolution: ScreenRecordingResolutionEnum) {
    if (!isNil(import.meta.env.VITE_VIDEO_RESOLUTION)) {
      this.service.mediaStore.updateVideoResolution(
        ScreenRecordingResolutionEnum.Low,
      );
    } else {
      this.service.mediaStore.updateVideoResolution(resolution);
    }
  }

  setMicrophoneEnabled(enabled: boolean) {
    if (enabled) {
      getMediaDeviceAccessAndStatus("microphone", true).then((res) => {
        res && this.service.TRTCCloud.muteLocalAudio(false);

        this.service.userManager.updateMicroPhoneAvailable(
          this.service.roomStore.localUser.sid,
          1,
        );
      });
    } else {
      this.service.TRTCCloud.muteLocalAudio(!enabled);

      this.service.userManager.updateMicroPhoneAvailable(
        this.service.roomStore.localUser.sid,
        0,
      );
    }

    armsService.addBehavior(
      ArmsBehaviorEnum.MICROPHONE,
      `${enabled ? "打开" : "关闭"}麦克风`,
    );
  }

  setScreenShareEnabled(
    {
      enabled,
      device,
    }: {
      enabled: boolean;
      device?: { sourceId: string; viewContainerID?: string };
    },
    callback?: (mediaStream: MediaStream | null) => void,
  ) {
    let mediaStream: MediaStream | null = null;

    if (enabled && device) {
      const { sourceId } = device!;

      const TRTCCloud = this.service.TRTCCloud;

      const view = document.createElement("div");

      if (!view) {
        console.error("videoElementId is not exist");
        return;
      }

      const data: TRTCScreenCaptureSourceInfo[] =
        TRTCCloud.getScreenCaptureSources(100, 100, 50, 50);

      const screen: TRTCScreenCaptureSourceInfo = data.find(
        (item) => item.sourceId === sourceId,
      )!;

      TRTCCloud.selectScreenCaptureTarget(
        screen,
        new Rect(0, 0, 0, 0),
        new TRTCScreenCaptureProperty(
          true, // enable capture mouse
          true, // enable highlight
          true, // enable high performance
          0xff66ff, // highlight color.
          8, // highlight width
          false, // disable capture child window
        ),
      );

      const screenShareEncParam = new TRTCVideoEncParam(
        ...this.service.mediaStore.videoResolutionParamArg,
      );

      TRTCCloud.startScreenCapture(
        view,
        TRTCVideoStreamType.TRTCVideoStreamTypeSub,
        screenShareEncParam,
      );

      const videoElement = view?.querySelector("video");

      if (videoElement && videoElement.srcObject) {
        mediaStream = videoElement.srcObject as MediaStream;

        this.service.roomStore.updateShareWindowInfo({
          ...screen,
          thumbBGRA: "",
          iconBGRA: "",
        } as any);
      }
    } else {
      this.service.TRTCCloud.stopScreenCapture();
    }

    this.service.roomStore.updateLocalUserInfo({
      screenShareStream: mediaStream,
    });

    callback && callback?.(mediaStream);

    armsService.addBehavior(
      ArmsBehaviorEnum.SHARE_SCREEN,
      `${enabled ? "开始" : "结束"}屏幕共享`,
    );

    this.service.emit(RoomEventEnum.RECORD_UPDATE);
  }

  async setCameraEnabled(enabled: boolean) {
    if (enabled) {
      await getMediaDeviceAccessAndStatus("camera", true)
        .then((res) => {
          if (res) {
            let mediaStream: MediaStream | null = null;

            const TRTCCloud = this.service.TRTCCloud;

            const view = document.createElement("div");

            const screenShareEncParam = new TRTCVideoEncParam(
              ...ScreenRecordingResolutionConst[
                ScreenRecordingResolutionEnum.Medium
              ],
            );

            TRTCCloud.setVideoEncoderParam(screenShareEncParam);

            TRTCCloud.startLocalPreview(view);

            const videoElement = view?.querySelector("video");

            if (videoElement && videoElement.srcObject) {
              mediaStream = videoElement.srcObject as MediaStream;
            }

            this.service.roomStore.updateLocalUserInfo({
              ...this.service.roomStore.localUser,
              cameraStream: mediaStream,
            });
          }
        })
        .catch(() => {});
    } else {
      this.service.TRTCCloud.stopLocalPreview();

      this.service.roomStore.updateLocalUserInfo({
        ...this.service.roomStore.localUser,
        cameraStream: null,
      });
    }

    this.service.emit(RoomEventEnum.RECORD_UPDATE);
  }

  stopAllSelfTransfers() {
    this.setMicrophoneEnabled(false);

    this.setCameraEnabled(false);

    this.setScreenShareEnabled({
      enabled: false,
    });
  }

  updateMicDevice() {
    const inputs = this.service.TRTCCloud.getMicDevicesList();

    const currentInputs = this.service.TRTCCloud.getCurrentMicDevice();

    this.service.mediaStore.updateCurrentMicInfo(currentInputs);

    this.service.mediaStore.updateMicDevicesListInfo(inputs);
  }

  updateSpeakerDevice() {
    const outputs = this.service.TRTCCloud.getSpeakerDevicesList();

    const currentOutputs = this.service.TRTCCloud.getCurrentSpeakerDevice();

    this.service.mediaStore.updateCurrentSpeakerInfo(currentOutputs);

    this.service.mediaStore.updateSpeakerDevicesListInfo(outputs);
  }

  updateCamera() {
    const cameras = this.service.TRTCCloud.getCameraDevicesList();

    const currentCamera = this.service.TRTCCloud.getCurrentCameraDevice();

    this.service.mediaStore.updateCurrentCameraInfo(currentCamera);

    this.service.mediaStore.updateCameraDevicesListInfo(cameras);
  }

  switchMicDevice(deviceId: string) {
    this.service.TRTCCloud.setCurrentMicDevice(deviceId);
  }

  switchSpeakerDevice(deviceId: string) {
    this.service.TRTCCloud.setCurrentSpeakerDevice(deviceId);
  }
}
