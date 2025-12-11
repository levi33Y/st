import {
  TRTCVideoEncParam,
  TRTCVideoResolution,
  TRTCVideoResolutionMode,
} from "trtc-electron-sdk";

export enum ScreenRecordingResolutionEnum {
  Low,
  Medium,
  High,
}

export const ScreenRecordingResolutionConst: Record<
  ScreenRecordingResolutionEnum,
  ConstructorParameters<typeof TRTCVideoEncParam>
> = {
  [ScreenRecordingResolutionEnum.Low]: [
    TRTCVideoResolution.TRTCVideoResolution_640_360,
    TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape,
    15,
    800,
    480,
    false,
  ],
  [ScreenRecordingResolutionEnum.Medium]: [
    TRTCVideoResolution.TRTCVideoResolution_1280_720,
    TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape,
    15,
    1200,
    720,
    false,
  ],
  [ScreenRecordingResolutionEnum.High]: [
    TRTCVideoResolution.TRTCVideoResolution_1920_1080,
    TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape,
    15,
    2000,
    1200,
    false,
  ],
};

export interface ITencentKeyResponseProps {
  appId: number;
  sdkSecretKey: string;
  resolution: ScreenRecordingResolutionEnum;
}

export interface ICloudRecordResponseProps {
  taskId: string;
  requestId: string;
  meetingRecordId: string;
}
