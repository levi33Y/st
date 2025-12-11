import moment from "moment-timezone";
import { MeetingTimeZoneEnum } from "../services/apis/meeting/types";

export const formatTimeStamp = (stamp: number) =>
  stamp < 1000000000000 ? Math.floor(stamp * 1000) : (stamp ?? 0);

export const dayDiffByTimeStamp = (pre: number, sub: number) => {
  const start = moment(formatTimeStamp(pre));

  const end = moment(formatTimeStamp(sub));

  const duration = moment.duration(end.diff(start));

  return moment.utc(duration.asMilliseconds()).format("HH:mm:ss") ?? "";
};

export const formatTimestampWithTimezone = (
  timestamp: number,
  timezone: MeetingTimeZoneEnum = MeetingTimeZoneEnum.Asia,
) => {
  moment.updateLocale("zh-cn", {
    weekdays: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
  });

  // 1. 创建 moment 对象，并设置时区
  const rawDate = moment.tz(moment.utc(formatTimeStamp(timestamp)), timezone);

  // 2. 转换为当前电脑时区 (可选，如果需要)
  const date = rawDate.clone().tz(moment.tz.guess()); // 获取当前时区并转换

  const now = moment();

  const today = now.clone().startOf("day");

  const tomorrow = today.clone().add(1, "day");

  const dayAfterTomorrow = today.clone().add(2, "day");

  if (date.isSame(today, "day")) {
    return `今天 ${date.format("M月D日")}`;
  } else if (date.isSame(tomorrow, "day")) {
    return `明天 ${date.format("M月D日")}`;
  } else if (date.isSame(dayAfterTomorrow, "day")) {
    return `後天 ${date.format("M月D日")}`;
  } else {
    return `${date.format("dddd")} ${date.format("M月D日")}`;
  }
};
