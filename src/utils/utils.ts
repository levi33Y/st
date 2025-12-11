import moment from "moment-timezone";
import { RoutePath } from "../entity/types";
import { updateRecordingUrlApi } from "../services";

/**
 * 获取环境
 * @returns Promise<"mac" | "win" | "other">
 */
export const getPlatform = async () => {
  const platform = await window.electronAPI.platform();
  if (platform === "darwin") {
    return "mac";
  }
  if (platform.startsWith("win")) {
    return "win";
  }
  return "other";
};

export const GUID = (): string => {
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
    .replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
    .toUpperCase();
};

export const handlerPathParams = (params: Record<string, any>) =>
  Object.keys(params)
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");

export const handlerSearchParams = (params: Record<string, any>) =>
  Object.keys(params).reduce((res, key) => {
    res.append(key, params[key]);
    return res;
  }, new URLSearchParams());

export const existsWindow = async (path: RoutePath, isFocus = true) => {
  const windowManage = await window.electronAPI.windowManage();
  const isHas = windowManage.record.has(path);
  isHas && isFocus && window.electronAPI.focus(path);
  return isHas;
};
export const formatDuration = (duration: number) => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const remainingSeconds = duration % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(remainingSeconds).padStart(2, "0")}`;
};

//处理所选时间等于所选时区时间
//本地时区与所选时区的偏移量
export const getSelectTimeZoneOffset = (selectTimezoneId: string) => {
  const currentTimeZone =
    Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone ?? ""; // 当前时区
  const currentTimeZoneTime = moment()?.tz(currentTimeZone)?.utcOffset() ?? 0; // 当前时区转时间
  const selectTimeZoneTime = moment()?.tz(selectTimezoneId)?.utcOffset() ?? 0; // 所选时区转时间
  return (selectTimeZoneTime - currentTimeZoneTime) * 60 * 1000; // 所选时区和当前时区的偏移量
};

// 所选时区时间转当前电脑时间
export const selectTimeZoneTimeToCurrentTimeZone = (
  time: Date | number,
  selectTimezoneId: string,
  format: string = "YYYY-MM-DD HH:mm",
) => {
  const date = +new Date(time) + getSelectTimeZoneOffset(selectTimezoneId);
  return moment(date).format(format);
};

// 当前电脑时间转所选时区时间
export const currentTimeZoneToSelectTimeZoneTime = (
  time: Date,
  selectTimezoneId: string,
  format?: string,
) => {
  const momentObj = moment
    .tz(
      +new Date(time) - getSelectTimeZoneOffset(selectTimezoneId),
      selectTimezoneId,
    )
    .utc();
  return format ? momentObj.format(format) : momentObj.toDate();
};

// 錄製url獲取權限才能查看下載
export const getApprovedUrls = async (urlArr: string[]) => {
  // http aliyun
  const isAliyun = urlArr.some((url) => url.startsWith("http"));

  const { urls } = isAliyun
    ? { urls: urlArr }
    : await updateRecordingUrlApi(urlArr);
  return urls.length > 0 ? urls : urls[0];
};
