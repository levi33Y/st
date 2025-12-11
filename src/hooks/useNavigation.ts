import { MeetingDropdownType } from "@/screens/sharing-dropdown-menu/props";
import { IDataEventProps } from "@/screens/trtc-room/components/member-list/props";
import { IMeetingLockRequestProps } from "@/services/apis/meeting/types";
import { WhiteboardDataType } from "@/utils/trtc/roomService";
import { IUserInfoProps } from "@/utils/trtc/store/room";
import { TRTCScreenCaptureSourceInfo } from "trtc-electron-sdk";
import { RoutePath } from "../entity/types";
import { BrowserWindowConstructorOptions } from "../renderer";
import { useSettingsStore } from "../stores/useSettingsStore";
import { existsWindow, handlerPathParams } from "../utils/utils";

export enum StoreEventEnum {
  ReserveShareCanvasMouse,
  IgnoreShareCanvasMouse,
  UpdateMeetingParticipants,
  UpdateMeetingPermission,
  OpenDrawingTool,
  LeaveMeeting,
  MemberListDataReceived,
  ShareScreen,
  UpdateModerator,
  SendDrawing,
  UpdateMeetingSecure,
  HideSharingMenuDropdown,
  WhiteboardToggleTool,
  WhiteboardSyncData,
  WhiteboardSendMessage,
  WhiteboardReady,
  WhiteboardError,
  WhiteboardSendError,
  WhiteboardSendAddAckData,
  UpdateDrawingBoard,
  RoomMemberUpdate,
  EndSharing,
  NET_STATE_CONNECTED,
  RoomPageReady,
  SwitchMeeting,
  OpenRoomDropdownMenu,
}

export interface IStoreEventProps {
  [StoreEventEnum.ReserveShareCanvasMouse]: any;
  [StoreEventEnum.IgnoreShareCanvasMouse]: any;
  [StoreEventEnum.UpdateMeetingParticipants]: any;
  [StoreEventEnum.UpdateMeetingPermission]: null;
  [StoreEventEnum.UpdateDrawingBoard]: WhiteboardDataType;
  [StoreEventEnum.OpenDrawingTool]: null;
  [StoreEventEnum.LeaveMeeting]: any;
  [StoreEventEnum.MemberListDataReceived]: IDataEventProps;
  [StoreEventEnum.ShareScreen]: TRTCScreenCaptureSourceInfo;
  [StoreEventEnum.UpdateModerator]: any;
  [StoreEventEnum.SendDrawing]: any;
  [StoreEventEnum.UpdateMeetingSecure]: IMeetingLockRequestProps;
  [StoreEventEnum.WhiteboardSyncData]: any;
  [StoreEventEnum.WhiteboardSendMessage]: WhiteboardDataType;
  [StoreEventEnum.WhiteboardReady]: any;
  [StoreEventEnum.WhiteboardSendError]: any;
  [StoreEventEnum.WhiteboardSendAddAckData]: WhiteboardDataType;
  [StoreEventEnum.WhiteboardToggleTool]: null;
  [StoreEventEnum.EndSharing]: null;
  [StoreEventEnum.HideSharingMenuDropdown]: null;
  [StoreEventEnum.RoomMemberUpdate]: IUserInfoProps[];
  [StoreEventEnum.WhiteboardError]: null;
  [StoreEventEnum.NET_STATE_CONNECTED]: null;
  [StoreEventEnum.RoomPageReady]: null;
  [StoreEventEnum.SwitchMeeting]: any;
  [StoreEventEnum.OpenRoomDropdownMenu]: MeetingDropdownType;
}

class Navigation {
  private coder = {
    encoder: new TextEncoder(),
    decoder: new TextDecoder(),
  };

  private getWindowConfig(
    route: RoutePath,
    params?: Record<string, any>,
  ): BrowserWindowConstructorOptions | undefined {
    const openDevTools = useSettingsStore().openDevTools;

    switch (route) {
      case "/home":
        return {
          width: 375,
          height: 667,
          frame: false,
          useContentSize: true,
          resizable: false,
          maximizable: false,
          titleBarStyle: "hidden",
          trafficLightPosition: { x: 12, y: 16 },
          openDevTools,
        };
      case "/settings":
        return {
          width: 720,
          height: 640,
          frame: false,
          useContentSize: true,
          resizable: false,
          maximizable: false,
          minimizable: false,
          titleBarStyle: "hidden",
          trafficLightPosition: { x: 12, y: 16 },
          openDevTools,
        };

      case "/feedback-list":
        return {
          width: 1503,
          height: 800,
          minWidth: 960,
          minHeight: 640,
          frame: false,
          useContentSize: true,
          titleBarStyle: "hidden",
          openDevTools,
        };

      case "/join-meeting":
        return {
          width: 375,
          height: 667,
          titleBarStyle: "hidden",
          resizable: false,
          maximizable: false,
          frame: false,
          useContentSize: true,
          openDevTools,
        };

      case "/schedule-meeting":
        return {
          width: 375,
          height: 775,
          maxWidth: 375,
          minWidth: 375,
          minHeight: 667,
          titleBarStyle: "hidden",
          maximizable: false,
          frame: false,
          useContentSize: true,
          openDevTools,
        };

      case "/history-meeting":
      case "/history-meeting-detail":
      case "/history-meeting-participant":
      case "/schedule-meeting-detail":
      case "/meeting-member":
      case "/schedule-meeting-setting":
        return {
          width: 375,
          height: 667,
          titleBarStyle: "hidden",
          resizable: false,
          maximizable: false,
          frame: false,
          useContentSize: true,
          openDevTools,
        };

      case "/meeting":
        return {
          width: 960,
          height: 640,
          minWidth: 960,
          minHeight: 640,
          frame: false,
          useContentSize: true,
          titleBarStyle: "hidden",
          openDevTools,
        };

      case "/intelligent-list":
        return {
          width: 1503,
          height: 800,
          minWidth: 960,
          minHeight: 640,
          frame: false,
          useContentSize: true,
          titleBarStyle: "hidden",
          openDevTools,
        };

      case "/intelligent-detail":
        return {
          width: 1503,
          height: 800,
          minWidth: 1269,
          minHeight: 800,
          frame: false,
          useContentSize: true,
          titleBarStyle: "hidden",
          openDevTools,
        };

      case "/invite":
        return {
          width: 640,
          height: 460,
          frame: false,
          useContentSize: true,
          resizable: false,
          maximizable: false,
          minimizable: false,
          openDevTools,
          titleBarStyle: "hidden",
        };
      case "/meeting-invitation-confirm":
        return {
          width: 640,
          height: 460,
          frame: false,
          useContentSize: true,
          resizable: false,
          maximizable: false,
          minimizable: false,
          openDevTools,
        };

      case "/room":
      case "/trtc-room":
        return {
          width: 960,
          height: 640,
          minWidth: 960,
          minHeight: 640,
          frame: false,
          transparent: true,
          useContentSize: true,
          titleBarStyle: "hidden",
          openDevTools,
        };
      case `/screen-name/${params?.id}`:
        return {
          width: 80,
          height: 80,
          frame: false,
          useContentSize: true,
          resizable: false,
          maximizable: false,
          alwaysOnTop: true,
          transparent: true,
          x: params?.bounds?.x,
          y: params?.bounds?.y,
        };

      case "/screen-border":
        return {
          width: 150,
          height: 30,
          frame: false,
          useContentSize: true,
          resizable: false,
          maximizable: true,
          titleBarStyle: "default",
          transparent: true,
          alwaysOnTop: true,
          show: false,
          x: (params?.bounds.x ?? 0) + (params?.bounds.width ?? 0) / 2 - 75,
          y: params?.bounds.y ?? 25,
          focusable: false,
          skipTaskbar: true,
        };

      case "/schedule-meeting-participant":
      case "/schedule-meeting-host":
        return {
          width: 640,
          height: 460,
          frame: false,
          useContentSize: true,
          resizable: false,
          maximizable: false,
          minimizable: false,
          openDevTools,
        };

      case "/share-screen-dialog":
      case "/trtc-screen-dialog":
        return {
          width: 700,
          height: 300,
          minWidth: 700,
          minHeight: 300,
          frame: false,
          useContentSize: true,
          titleBarStyle: "hidden",
          resizable: false,
          maximizable: false,
          minimizable: false,
          openDevTools,
        };

      case "/share-canvas":
      case "/trtc-screen-canvas":
        return {
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          frame: false,
          roundedCorners: false,
          useContentSize: true,
          resizable: false,
          maximizable: true,
          titleBarStyle: "default",
          transparent: true,
          alwaysOnTop: true,
          show: false,
          focusable: false,
          skipTaskbar: true,
        };

      case "/room-member-list":
      case "/trtc-room-member":
        return {
          width: 387,
          height: 640,
          minWidth: 387,
          minHeight: 640,
          frame: false,
          useContentSize: true,
          titleBarStyle: "hidden",
          resizable: false,
          maximizable: false,
          minimizable: false,
          openDevTools,
        };

      case "/room-leave-dialog":
        return {
          width: 192,
          height: 176,
          frame: false,
          roundedCorners: false,
          useContentSize: true,
          resizable: false,
          maximizable: true,
          titleBarStyle: "default",
          alwaysOnTop: true,
          show: false,
          skipTaskbar: true,
        };

      case "/version-update":
        return {
          width: 520,
          height: 450,
          frame: false,
          useContentSize: true,
          resizable: false,
          maximizable: false,
          minimizable: false,
          titleBarStyle: "hidden",
          alwaysOnTop: true,
          trafficLightPosition: { x: 12, y: 16 },
          openDevTools,
        };

      case "/schedule-meeting-cycle":
        return {
          width: 480,
          height: 668,
          minWidth: 480,
          minHeight: 668,
          frame: false,
          useContentSize: true,
          resizable: true,
          maximizable: false,
          minimizable: false,
          openDevTools,
        };
      default:
        return undefined;
    }
  }

  navigate(
    name: RoutePath,
    params?: Record<string, any>,
    options?: BrowserWindowConstructorOptions,
  ) {
    const { createWindow } = window.electronAPI;

    const path = params ? `${name}?${handlerPathParams(params)}` : name;

    const config = this.getWindowConfig(name, params);

    if (!config) {
      return this;
    }

    // 子窗口
    if (
      [
        "/schedule-meeting-participant",
        "/schedule-meeting-host",
        "/schedule-meeting-cycle",
      ].includes(name) &&
      !options?.parent
    ) {
      return this;
    }

    createWindow(path, { ...config, ...options });

    return this;
  }

  destroy(path: RoutePath) {
    window.electronAPI.getCurrentWindow().destroy(path);

    return this;
  }

  openMainWindow() {
    window.electronAPI.openMainWindow();
    return this;
  }

  close(path?: string) {
    window.windowControl?.close(path);

    return this;
  }

  closeToHide() {
    window.electronAPI.closeToHide();
    return this;
  }

  blockClose(path: string, callback: () => void) {
    window.electronAPI.blockClose(path, callback);
    return this;
  }

  emit<T extends StoreEventEnum>(type: T, msg?: IStoreEventProps[T]) {
    let m: any = msg;

    try {
      const hash = JSON.stringify(msg);

      m = hash;
    } catch (err) {
      console.warn(type, err);
    } finally {
      window.store.dispatch(type, m ?? "");
    }

    return this;
  }

  on<T extends StoreEventEnum>(
    type: T,
    callback: (data: IStoreEventProps[T]) => void | Promise<void>,
  ) {
    window.store.subscribe((id: StoreEventEnum, hash: any) => {
      let data = hash;

      try {
        if (hash && typeof hash === "string") {
          let d = JSON.parse(hash);

          data = d;
        }

        if (id == type) {
          callback(data);
        }
      } catch (err) {
        console.warn(type, err);
      }
    });

    return this;
  }

  async reNavigate(name: RoutePath, params?: Record<string, any>) {
    const config = this.getWindowConfig(name, params);

    const isHas = await existsWindow(name);

    if (!isHas) {
      this.navigate(name, params, config);

      return;
    } else {
      const path = params ? `${name}?${handlerPathParams(params)}` : name;

      window.electronAPI.reOpen(path, config);
    }
  }
}

const navigation = new Navigation();

export const useNavigation = () => {
  return navigation;
};
