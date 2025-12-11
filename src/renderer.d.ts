import { StoreEventEnum } from "@/hooks/useNavigation";
import { BrowserWindowConstructorOptions as BrowserWindowOptions } from "electron";
import { WindowManage } from "../electron/main/utils";
import { ScreenSource } from "./entity/types";

export interface CurrentWindow {
  close: () => Promise<void>;
  destroy: (path?: string) => Promise<void>;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  setFullScreen: (flag: boolean) => Promise<void>;
  getSize: (path?: string) => Promise<number[]>;
  setSize: (
    width: number,
    height: any,
    animate?: boolean,
    path?: string,
  ) => Promise<void>;
  onGetWindowSize: (path: string) => Promise<any>;
}

interface AppInfo {
  name: string;
  version: string;
  platform: string;
}

export interface VideoFrame {
  index: number;
  timestamp: number;
  imageData: string; // base64
}

interface BrowserWindowConstructorOptions
  extends Omit<BrowserWindowOptions, "parent"> {
  parent?: boolean;
  openDevTools?: boolean;
  immediate?: boolean;
}

export interface IElectronAPI {
  downloadVideo: (url: string | string[]) => Promise<{
    success: boolean;
    directory: string;
    succeeded: string[];
    failed: { url: string; error: string }[];
  }>;
  platform: () => Promise<NodeJS.Platform>;
  appInfo: () => Promise<AppInfo>;
  allDisplays: () => Promise<Display[]>;
  openMainWindow: () => Promise<void>;
  createWindow: (
    path: string,
    options?: BrowserWindowConstructorOptions,
  ) => Promise<void>;
  reOpen: (
    path: string,
    options?: BrowserWindowConstructorOptions,
  ) => Promise<void>;
  getCurrentWindow: () => CurrentWindow;
  windowManage: () => Promise<WindowManage>;
  focus: (path: string) => Promise<void>;
  enterFullscreen: (callback: () => void) => void;
  leaveFullscreen: (callback: () => void) => void;
  onClose: (
    options: Electron.MessageBoxSyncOptions,
    callback: () => void,
  ) => void;
  blockClose: (path: string, callback: () => void) => void;
  closeToHide: () => void;
  execCommand: (command: string) => Promise<void>;
  getLocalAudioArrayBuffer: () => Promise<ArrayBuffer>;
  getBase64ByFilePath: (filePath: string) => Promise<string>;
  showContextMenu: (imageURL: string) => Promise<void>;
  logout: () => Promise<void>;
  sendEachWindows: (callback: () => void) => void;
  sendEachWindowsMessage: (url: string) => Promise<void>;
  onLoadWindow: () => Promise<void>;
  onOpenChildrenWindow: (winId: number) => Promise<void>;
  extractVideoKeyframes: (
    videoPath: string,
    frameCount: number,
    frameWidth: number,
    frameHeight: number,
  ) => Promise<VideoFrame[]>;
}

export interface IDesktopCapturer {
  getSources: (options: Electron.SourcesOptions) => Promise<ScreenSource[]>;
}

export interface IMonitorScreenProps {
  onGetPrimaryDisplay: () => Promise<Electron.Size>;
}

export interface ISystemPreferences {
  askForMediaAccess: (mediaType: "microphone" | "camera") => Promise<boolean>;
  getMediaAccessStatus: (
    mediaType: "microphone" | "camera" | "screen",
  ) => Promise<
    "not-determined" | "granted" | "denied" | "restricted" | "unknown"
  >;
}

export interface IDialog {
  showOpenDialogSync: (
    options: Electron.MessageBoxSyncOptions,
  ) => Promise<number>;
}

export interface IClipboard {
  writeText: (text: string) => Promise<void>;
  readImage: () => Promise<string>;
}

export interface IStore {
  dispatch: (id: StoreEventEnum, hash: string) => Promise<void>;
  subscribe: (callback: (id: StoreEventEnum, hash: string) => void) => void;
}

interface ILoudness {
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  getMuted: () => Promise<boolean>;
  setMuted: (muted: boolean) => Promise<void>;
}

interface IWinEvenBodyProps {
  winId: string;
  path: string;
}

interface IWinEventsProps {
  onFocus: (callback: (winId?: string) => void) => void;
  onBlur: (callback: (winId?: string) => void) => void;
  onLoad: (callback: (body: IWinEvenBodyProps) => void) => void;
  onClose: (callback: (winId: string) => void) => void;
}

interface IChannelMessagingProps {
  onSendMessage: (message?: any) => void;
  onGiveMessage: () => void;
}

interface IProcessProps {
  onInstall: () => Promise<void>;
  onSwitchDefault: () => Promise<void>;
  InShareScreen: () => Promise<void>;
  onInstallByPlatform: (platform: "mac" | "win" | "other") => Promise<void>;
  onSwitchDefaultByWin: (
    target: "default" | "virtual",
    virtualDevice: string,
    defaultDevice: string,
  ) => Promise<void>;
}

interface IAutoUpdaterProps {
  checkForUpdate: (windowName: string) => Promise<void>;
  downloadUpdate: () => Promise<void>;
  quitAndInstall: () => Promise<void>;
}

interface IWindowControlProps {
  focus: (path?: string) => Promise<void>;
  close: (path?: string) => Promise<void>;
  show: (path: string, p: [number, number]) => Promise<void>;
  hide: (path: string) => Promise<void>;
  setSize: (
    path: string,
    config?: Partial<{
      height: number;
      width: number;
      maxWidth: number;
      maxHeight: number;
      minWidth: number;
      minHeight: number;
      animate?: boolean;
    }>,
  ) => Promise<void>;
  setPenetrate: (path: string, isUsing?: boolean) => Promise<void>;
  setWindowsButton: (path: string, visible: boolean) => Promise<void>;
  setPin: (path: string, isFixed?: boolean) => Promise<void>;
  setResizable: (path: string, resizable: boolean) => Promise<void>;
  setMovable: (path: string, movable: boolean) => Promise<void>;
  setLevel: (path: string, level: WindowsLevelEnum) => Promise<void>;
}

interface IScreenProps {
  allDisplays: () => Promise<Electron.Display[]>;
  cursorPoint: () => Promise<Electron.Point>;
}

interface IMeetingNoticeProps {
  subNotice: (baseURL: string, token: string) => Promise<void>;
  stopSubNotice: () => Promise<void>;
}

interface IFileSystemProps {
  selectDirectory: () => Promise<string | null>;
  openDirectory: (
    dirPath: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getDefaultRecordPath: () => Promise<string>;
  setRecordSavePath: (savePath: string) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
    desktopCapturer: IDesktopCapturer;
    monitorScreen: IMonitorScreenProps;
    systemPreferences: ISystemPreferences;
    dialog: IDialog;
    clipboard: IClipboard;
    store: IStore;
    loudness: ILoudness;
    winEvents: IWinEventsProps;
    windowControl: IWindowControlProps;
    channelMessaging: IChannelMessagingProps;
    device: IProcessProps;
    screenAPi: IScreenProps;
    autoUpdater: IAutoUpdaterProps;
    ipcRenderer: Electron.IpcRenderer;
    TEduBoard: any;
    meetingNotice: IMeetingNoticeProps;
    fileSystem: IFileSystemProps;
  }

  interface AudioContext {
    setSinkId(sinkId: string): Promise<void>;
  }
}
