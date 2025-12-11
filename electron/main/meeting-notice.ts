import { app, BrowserWindow, ipcMain, screen } from "electron";
import { isNil } from "lodash";
import { MeetingAppointmentRecord, RoutePath } from "../../src/entity/types";
import { PoolItem, PoolMode, WindowPool } from "./pool";

interface IScheduleNoticeProps {
  meetingId: string;
  meetingNumber: string;
  title: string;
  startDate: string;
  endDate: string;
}

interface IInvitationNoticeProps {
  id: number;
  meetingId: string;
  meetingSubId: string;
  invitingPeople: string;
  meetingTitle: string;
  invitingPeopleAvatarUrl?: string;
}

interface INoticeItemProps {
  route: RoutePath;
  poolItem: PoolItem;
  createdAt: number;
  meetingId?: string;
  noticeId?: string;
}

type NoticeType = "schedule" | "invitation";

const schedulePage = "/meeting-schedule-notice";

const invitationPage = "/meeting-invitation-notice";

class NoticeItem {
  route: string;

  poolItem: PoolItem;

  createdAt: number;

  type: NoticeType;

  windowId: number;

  meetingId?: string;

  noticeId?: string;

  constructor(arg: INoticeItemProps) {
    this.poolItem = arg.poolItem;

    this.windowId = arg.poolItem.id;

    this.route = arg.route;

    this.createdAt = arg.createdAt;

    if (arg?.route === schedulePage) {
      this.type = "schedule";
    } else if (arg?.route === invitationPage) {
      this.type = "invitation";
    }

    this.meetingId = arg?.meetingId;

    this.noticeId = arg?.noticeId;
  }
}

class NoticePool extends WindowPool {
  notificationWindows: NoticeItem[] = [];

  constructor() {
    super(PoolMode.IMMEDIATE_REFILL, 3);
  }

  private hasNotifiedMeeting(meetingId: string): boolean {
    try {
      const isHas = this.notificationWindows?.some(
        (item) => item?.meetingId === meetingId && item.type === "schedule",
      );

      return isHas;
    } catch (error) {
      return true;
    }
  }

  private hasNotifiedInvitation(
    meetingId: string,
    noticeId: string,
  ): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const window = this.notificationWindows?.find(
          (item) => item?.meetingId === meetingId && item.type === "invitation",
        );

        if (isNil(window)) {
          resolve(false);
        } else {
          if (window?.noticeId !== noticeId) {
            await window?.poolItem?.destroy();

            resolve(false);
          } else {
            resolve(true);
          }
        }
      } catch (error) {
        reject(true);
      }
    });
  }

  private async limitNotificationWindows() {
    if (this.notificationWindows.length >= 3) {
      const oldestNotification = this.notificationWindows.reduce(
        (oldest, current) =>
          current.createdAt < oldest.createdAt ? current : oldest,
      );

      await oldestNotification?.poolItem?.destroy();
    }
  }

  private recalculateWindowPositions() {
    const screenBounds = screen.getPrimaryDisplay().bounds;

    if (!screenBounds) {
      return;
    }

    /* macOS Menu Bar */
    const topPadding = 30;

    /* macOS taskBar */
    const bottomPadding = 130;

    const horizontalPadding = screenBounds.width - 15;

    const gapPadding = 30;

    const scheduleWindows =
      this.notificationWindows
        ?.filter((w) => w.type === "schedule")
        ?.sort((a, b) => a.createdAt - b.createdAt)
        .map((w) => w.poolItem?.instance) ?? [];

    const invitationWindows =
      this.notificationWindows
        ?.filter((w) => w.type === "invitation")
        ?.sort((a, b) => b.createdAt - a.createdAt)
        .map((w) => w.poolItem?.instance) ?? [];

    for (
      let i = 0, currentTopY = topPadding, item = null;
      (item = scheduleWindows[i++]);

    ) {
      try {
        if (!item || item.isDestroyed()) {
          continue;
        }

        const { width, height } = item.getBounds();

        item.setPosition(horizontalPadding - width, currentTopY);

        currentTopY += height + gapPadding;
      } catch {}
    }

    for (
      let i = 0,
        currentBottomY = screenBounds.height - bottomPadding,
        item = null;
      (item = invitationWindows[i++]);

    ) {
      try {
        if (!item || item.isDestroyed()) {
          continue;
        }

        const { width, height } = item.getBounds();

        item.setPosition(horizontalPadding - width, currentBottomY - height);

        currentBottomY -= height + gapPadding;
      } catch {}
    }
  }

  create(
    name: RoutePath,
    options: IScheduleNoticeProps | IInvitationNoticeProps,
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        let isHas = true;

        if (name === schedulePage) {
          isHas = this.hasNotifiedMeeting(options?.meetingId);
        } else if (name === invitationPage) {
          isHas = await this.hasNotifiedInvitation(
            options?.meetingId,
            (options as IInvitationNoticeProps)?.id + "",
          );
        }

        if (isHas) {
          throw "notice is exist";
        }

        await this.limitNotificationWindows();

        const window = await super.use();

        if (!window || !window?.instance || window.instance.isDestroyed()) {
          throw "window is null";
        }

        window.instance.on("closed", () => {
          try {
            const newWindows = this.notificationWindows?.filter(
              (item) => item.windowId !== window.id,
            );

            if (!isNil(newWindows)) {
              this.notificationWindows = newWindows;
            }
          } catch {}

          setTimeout(() => checkAndCleanup(), 100);
        });

        await window.loadUrl(name, { ...options, windowId: window.id });

        this.notificationWindows.push(
          new NoticeItem({
            route: name,
            poolItem: window,
            createdAt: Date.now(),
            meetingId: options.meetingId,
            noticeId: (options as IInvitationNoticeProps)?.id + "",
          }),
        );

        window.instance.setSize(300, 160, true);

        this.recalculateWindowPositions();

        window.instance.show();

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  async releaseAllNotice() {
    try {
      this.notificationWindows?.forEach(async (item) => {
        await item?.poolItem?.destroy();
      });

      this.notificationWindows = [];
    } catch (error) {
      throw error;
    }
  }
}

export const noticePool = new NoticePool();

async function monitorMeetingAppointments(baseURL: string, token: string) {
  const response = await fetch(`${baseURL}/Meeting/appointment`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw response;
  }

  const data = await response.json();

  const records = (data?.data?.records as MeetingAppointmentRecord[]) ?? [];

  const now = Date.now();

  const upcomingMeetings =
    records.filter((meeting) => {
      const threeMinutes = 3 * 60 * 1000;

      const towMinutes = 2 * 60 * 1000;

      const startTimeMs = meeting.startDate * 1000;

      const timeDiff = startTimeMs - now;

      return timeDiff > 0 && timeDiff <= threeMinutes && timeDiff > towMinutes;
    }) ?? [];

  for (let i = 0, item = null; (item = upcomingMeetings[i++]); ) {
    await noticePool.create(schedulePage, {
      meetingId: item?.meetingId,
      meetingNumber: item?.meetingNumber,
      title: item?.title,
      startDate: item?.startDate,
      endDate: item?.endDate,
    });
  }
}

async function monitorMeetingInvitations(baseURL: string, token: string) {
  const response = await fetch(`${baseURL}/Meeting/invite/records`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw response;
  }

  const data = await response.json();

  const records = (data?.data as IInvitationNoticeProps[]) ?? [];

  const filteredRecords = records.reduce((acc, current) => {
    const existingIndex = acc.findIndex(
      (item) => item.meetingId === current.meetingId,
    );

    if (existingIndex === -1) {
      acc.push(current);
    } else {
      if (current.id > acc[existingIndex].id) {
        acc[existingIndex] = current;
      }
    }

    return acc;
  }, [] as IInvitationNoticeProps[]);

  for (let i = 0, item = null; (item = filteredRecords[i++]); ) {
    await noticePool.create(invitationPage, {
      id: item?.id,
      meetingId: item?.meetingId,
      meetingSubId: item?.meetingSubId,
      invitingPeople: item?.invitingPeople,
      meetingTitle: item?.meetingTitle,
      meetingNumber: item?.meetingNumber,
      invitingPeopleAvatarUrl: item?.url,
    });
  }
}

let subNoticeInterval: NodeJS.Timeout | null = null;

let noticeIntervalFlag = true;

let subInvitationInterval: NodeJS.Timeout | null = null;

let invitationIntervalFlag = true;

ipcMain.handle("sub-notice", (_, { baseURL, token }) => {
  if (!baseURL || !token) {
    return;
  }

  monitorMeetingAppointments(baseURL, token)
    .catch((err) => {})
    .finally(() => {
      noticeIntervalFlag = true;
    });

  if (isNil(subInvitationInterval)) {
    subNoticeInterval = setInterval(() => {
      if (noticeIntervalFlag) {
        noticeIntervalFlag = false;

        monitorMeetingAppointments(baseURL, token)
          .catch((err) => {})
          .finally(() => {
            noticeIntervalFlag = true;
          });
      }
    }, 60000);
  }

  if (isNil(subInvitationInterval)) {
    subInvitationInterval = setInterval(() => {
      if (invitationIntervalFlag) {
        invitationIntervalFlag = false;

        monitorMeetingInvitations(baseURL, token)
          .catch((err) => {})
          .finally(() => {
            invitationIntervalFlag = true;
          });
      }
    }, 5000);
  }
});

async function stopSubNotice() {
  try {
    subNoticeInterval && clearInterval(subNoticeInterval);

    subNoticeInterval = null;

    subInvitationInterval && clearInterval(subInvitationInterval);

    subInvitationInterval = null;

    await noticePool.releaseAllNotice();

    await noticePool.clear();
  } catch (error) {
    throw error;
  }
}

ipcMain.handle("stop-sub-notice", stopSubNotice);

export function checkAndCleanup() {
  if (process.platform === "darwin") {
    return;
  }

  const allWindows = BrowserWindow.getAllWindows();

  const hasNonPoolWindow = allWindows.some((window) => {
    return !noticePool.isPoolWindow(window.id);
  });

  if (!hasNonPoolWindow) {
    Promise.all([noticePool.releaseAllNotice(), noticePool.clear()]).finally(
      () => {
        app.quit();
      },
    );
  }
}
