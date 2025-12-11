import { ElMessage } from "element-plus";
import { getPlatform } from "./utils";

/**
 * 获取媒体设备状态
 * @param mediaType "microphone" | "camera"
 * @returns Promise<boolean>
 */
export const getMediaDeviceStatus = async (
  mediaType: "microphone" | "camera",
) => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const kind = mediaType === "microphone" ? "audioinput" : "videoinput";
  return devices.some((device) => device.kind === kind && device.label);
};

/**
 * 获取媒体设备授权状态
 * @param mediaType "microphone" | "camera" | "screen"
 * @returns Promise<boolean>
 */
export const getMediaDeviceAccess = async (
  mediaType: "microphone" | "camera" | "screen",
) => {
  const platform = await getPlatform();
  if (platform === "mac") {
    if (mediaType === "screen") {
      const status =
        await window.systemPreferences.getMediaAccessStatus(mediaType);
      return status === "granted";
    } else {
      return window.systemPreferences.askForMediaAccess(mediaType);
    }
  } else if (platform === "win") {
    if (mediaType === "screen") {
      return true;
    }
    const status =
      await window.systemPreferences.getMediaAccessStatus(mediaType);
    return status === "granted";
  }
  return false;
};

/**
 * 获取媒体设备授权/状态 弹窗
 * @param mediaType "microphone" | "camera" | "screen"
 * @param access boolean 设备授权状态
 * @param status boolean 设备状态 - 是否有设备
 */
export const showRequestMediaAccessDialog = async (
  mediaType: "microphone" | "camera" | "screen",
  access: boolean,
  status: boolean,
) => {
  const platform = await getPlatform();
  const appName = await (await window.electronAPI.appInfo()).name;
  if (mediaType === "screen") {
    // 没有录制屏幕权限
    if (platform === "mac") {
      // macOS系统打开设置 - 屏幕录制权限
      const defaultId = 1;
      const index = await window.dialog.showOpenDialogSync({
        type: "error",
        message: "打開屏幕錄製權限",
        detail: `由於macOS 10.15 系統要求，請在“系統偏好設置-安全性與隱私-屏幕錄製”中勾選"${appName}"`,
        buttons: ["取消", "打開系統偏好設置"],
        defaultId,
        cancelId: 0,
      });
      if (index === defaultId) {
        // 系统偏好设置-安全性与隐私-屏幕录制
        window.electronAPI.execCommand(
          `open x-apple.systempreferences:com.apple.preference.security\?Privacy_ScreenCapture`,
        );
      }
    }
  } else {
    const device = mediaType === "microphone" ? "麥克風" : "攝像頭";
    if (!status) {
      // 没有摄像头、麦克风
      ElMessage({
        message: `未檢測到可用${device}，請連接設備後重試`,
        type: "warning",
      });
    } else if (!access) {
      // 没有摄像头、麦克风权限
      const defaultId = 0;
      if (platform === "mac") {
        const index = await window.dialog.showOpenDialogSync({
          type: "error",
          message: `無法使用${device}`,
          detail: `請在“系統偏好設置-安全性與隱私”中允許"${appName}"访问您的${device}`,
          buttons: ["前往設置", "取消"],
          defaultId,
          cancelId: 1,
        });
        if (index === defaultId) {
          // 系统偏好设置-安全性与隐私-麦克风/摄像头
          const command =
            mediaType === "microphone"
              ? `open x-apple.systempreferences:com.apple.preference.security\?Privacy_Microphone`
              : `open x-apple.systempreferences:com.apple.preference.security\?Privacy_Camera`;
          window.electronAPI.execCommand(command);
        }
      } else if (platform === "win") {
        const index = await window.dialog.showOpenDialogSync({
          type: "error",
          message: `允許使用${device}`,
          detail: `請在“設置-隱私”下到“麥克風”中允許應用使用${device}`,
          buttons: ["前往設置", "取消"],
          defaultId,
          cancelId: 1,
        });
        if (index === defaultId) {
          const command =
            mediaType === "microphone"
              ? `start ms-settings:privacy-microphone`
              : `start ms-settings:privacy-webcam`;
          window.electronAPI.execCommand(command);
        }
      }
    }
  }
};

/**
 * 获取媒体设备授权/状态
 * @param mediaType "microphone" | "camera" | "screen"
 * @param requestAccess boolean
 * @returns Promise<boolean>
 */
export const getMediaDeviceAccessAndStatus = async (
  mediaType: "microphone" | "camera" | "screen",
  requestAccess = false,
) => {
  const access = await getMediaDeviceAccess(mediaType);
  let status = false;

  if (mediaType == "screen") {
    status = true;
  } else {
    status = await getMediaDeviceStatus(mediaType);
  }

  if (access && status) return true;

  if (requestAccess) {
    showRequestMediaAccessDialog(mediaType, access, status);
  }

  return false;
};

/**
 * 弹出获取屏幕录制权限申请弹窗
 * @returns
 */
export const getScreenCaptureAccess = () =>
  window.desktopCapturer.getSources({ types: ["window", "screen"] });
