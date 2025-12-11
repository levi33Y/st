import { DesktopCapturerSource, SourcesOptions, ipcRenderer } from "electron";
import { ScreenSource } from "../../src/entity/types";
import {
  BrowserWindowConstructorOptions,
  CurrentWindow,
} from "../../src/renderer";

const withPrototype = (obj: Electron.IpcRenderer) => {
  const protos = Object.getPrototypeOf(obj);

  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue;

    if (typeof value === "function") {
      obj[key] = function (...args: any) {
        return value.call(obj, ...args);
      };
    } else {
      obj[key] = value;
    }
  }
  return obj;
};

window.electronAPI = {
  platform: () => ipcRenderer.invoke("getPlatform"),
  allDisplays: () => ipcRenderer.invoke("getAllDisplays"),
  appInfo: () => ipcRenderer.invoke("getAppInfo"),
  openMainWindow: () => ipcRenderer.invoke("open-main-win"),
  createWindow: (path: string, options: BrowserWindowConstructorOptions = {}) =>
    ipcRenderer.invoke("open-win", path, options),
  reOpen: (path: string, options: BrowserWindowConstructorOptions = {}) =>
    ipcRenderer.invoke("re-open-win", path, options),
  getCurrentWindow: (): CurrentWindow => ({
    close: () => ipcRenderer.invoke("close-window"),
    destroy: (path?: string) => ipcRenderer.invoke("destroy-window", path),
    minimize: () => ipcRenderer.invoke("minimize-window"),
    maximize: () => ipcRenderer.invoke("maximize-window"),
    unmaximize: () => ipcRenderer.invoke("unmaximize-window"),
    setFullScreen: (flag: boolean) => ipcRenderer.invoke("setFullScreen", flag),
    getSize: (path?: string) => ipcRenderer.invoke("getSize", path),
    setSize: (width: number, height, animate?: boolean, path?: string) =>
      ipcRenderer.invoke("setSize", width, height, animate, path),
    onGetWindowSize: (path?: string) =>
      ipcRenderer.invoke("get-win-size", path),
  }),
  windowManage: () => ipcRenderer.invoke("window-manage"),
  focus: (path: string) => ipcRenderer.invoke("focus-window", path),
  enterFullscreen: (callback: () => void) =>
    ipcRenderer.on("enter-full-screen", callback),
  leaveFullscreen: (callback: () => void) =>
    ipcRenderer.on("leave-full-screen", callback),
  onClose: (options: Electron.MessageBoxSyncOptions, callback: () => void) => {
    ipcRenderer.invoke("close-win-with-dialog", options);
    ipcRenderer.on("onCloseWindow", callback);
  },
  blockClose: (path: string, callback: () => void) => {
    ipcRenderer.invoke("block-win-close", path);
    ipcRenderer.on("onBlockWindowClose", callback);
  },
  closeToHide: () => ipcRenderer.invoke("close-win-with-hide"),
  execCommand: (command: string) => ipcRenderer.invoke("execCommand", command),
  getLocalAudioArrayBuffer: () =>
    ipcRenderer.invoke("get-local-audio-arraybuffer"),
  getBase64ByFilePath: (filePath: string) =>
    ipcRenderer.invoke("get-base64-by-filePath", filePath),
  showContextMenu: (imageURL: string) =>
    ipcRenderer.invoke("show-context-menu", imageURL),
  logout: () => ipcRenderer.invoke("logout"),
  downloadVideo: (url: string | string[]) => {
    return ipcRenderer.invoke("download-video", url);
  },
  sendEachWindows: (callback: () => void) => {
    ipcRenderer.on("send-each-windows", callback);
  },
  sendEachWindowsMessage: (url: string) => {
    return ipcRenderer.invoke("send-each-windows-message", url);
  },
  onLoadWindow: () => ipcRenderer.invoke("load-window"),
  onOpenChildrenWindow: async (winId: number) => {
    await ipcRenderer.invoke("open-child-win", winId);
  },
  extractVideoKeyframes: (
    videoPath: string,
    frameCount: number,
    frameWidth: number,
    frameHeight: number,
  ) =>
    ipcRenderer.invoke(
      "extract-video-keyframes",
      videoPath,
      frameCount,
      frameWidth,
      frameHeight,
    ),
};

window.desktopCapturer = {
  getSources: async (options: SourcesOptions): Promise<ScreenSource[]> => {
    const sources: DesktopCapturerSource[] = await ipcRenderer.invoke(
      "getSources",
      options,
    );
    console.log(sources);

    return sources.map((source) => ({
      appIcon: source.appIcon?.toDataURL() ?? "",
      display_id: source.display_id,
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
    })) as ScreenSource[];
  },
};

window.systemPreferences = {
  askForMediaAccess: (mediaType: "microphone" | "camera") =>
    ipcRenderer.invoke("askForMediaAccess", mediaType),
  getMediaAccessStatus: (mediaType: "microphone" | "camera") =>
    ipcRenderer.invoke("getMediaAccessStatus", mediaType),
};

window.dialog = {
  showOpenDialogSync: (options: Electron.MessageBoxSyncOptions) =>
    ipcRenderer.invoke("showOpenDialogSync", options),
};

window.clipboard = {
  writeText: (text: string) => ipcRenderer.invoke("clipboard.writeText", text),
  readImage: () => ipcRenderer.invoke("clipboard.readImage"),
};

window.store = {
  dispatch: (id: string, hash: string) =>
    ipcRenderer.invoke("store-dispatch", id, hash),
  subscribe: (callback: (id: string, hash: string) => void) => {
    ipcRenderer.on("store-dispatch", (_, id: string, hash: string) =>
      callback(id, hash),
    );
  },
};

window.loudness = {
  getVolume: () => ipcRenderer.invoke("loudness.getVolume"),
  setVolume: (volume: number) =>
    ipcRenderer.invoke("loudness.setVolume", volume),
  getMuted: () => ipcRenderer.invoke("loudness.getMuted"),
  setMuted: (muted: boolean) => ipcRenderer.invoke("loudness.setMuted", muted),
};

window.winEvents = {
  onFocus: (callback) =>
    ipcRenderer.on("win-focus", (_, winId) => callback(winId)),
  onBlur: (callback) =>
    ipcRenderer.on("win-blur", (_, winId) => callback(winId)),
  onClose: (callback) =>
    ipcRenderer.on("win-close", (_, winId) => callback(winId)),
  onLoad: (callback) => ipcRenderer.on("win-load", (_, body) => callback(body)),
};

window.windowControl = {
  close: (path) => ipcRenderer.invoke("close-window-focus", path),
  focus: (path: string) => ipcRenderer.invoke("focus-window", path),
  hide: (path) => ipcRenderer.invoke("hide-window", path),
  show: (path: string, p: [number, number]) =>
    ipcRenderer.invoke("show-window", path, p),
  setSize: (
    path,
    config: {
      height: number;
      width: number;
      maxWidth: number;
      maxHeight: number;
      minWidth: number;
      minHeight: number;
      animate?: boolean;
    },
  ) => ipcRenderer.invoke("set-limit-size", path, config),
  setPenetrate: (path, isUsing) =>
    ipcRenderer.invoke("set-penetrate", path, isUsing),
  setWindowsButton: (path, visible) =>
    ipcRenderer.invoke("set-windows-button", path, visible),
  setPin: (path, isFixed) => ipcRenderer.invoke("set-fixed-win", path, isFixed),
  setResizable: (path, resizable) =>
    ipcRenderer.invoke("set-resizable", path, resizable),
  setMovable: (path, movable) =>
    ipcRenderer.invoke("set-movable", path, movable),
  setLevel: (path, level) =>
    ipcRenderer.invoke("set-window-level", path, level),
};

window.channelMessaging = {
  onSendMessage: (message) => {
    return ipcRenderer.invoke("channel-send-message", message);
  },
  onGiveMessage: () => {
    ipcRenderer.on("main-give-message", async (e) => {
      const origin = process.env.VITE_DEV_SERVER_URL + "";
      window.postMessage("main-give-message", "*", e.ports);
    });
  },
};

window.monitorScreen = {
  onGetPrimaryDisplay: () => ipcRenderer.invoke("get-primary-display"),
};

window.device = {
  onInstall: () => ipcRenderer.invoke("download-blackhole"),
  onSwitchDefault: () => ipcRenderer.invoke("switch-default"),
  InShareScreen: () => ipcRenderer.invoke("in-share-screen"),
  onInstallByPlatform: (platform: "mac" | "win" | "other") =>
    ipcRenderer.invoke("download-device", platform),
  onSwitchDefaultByWin: (
    target: "default" | "virtual",
    virtualDevice: string,
    defaultDevice: string,
  ) =>
    ipcRenderer.invoke(
      "switch-device-win",
      target,
      virtualDevice,
      defaultDevice,
    ),
};

window.autoUpdater = {
  checkForUpdate: (windowName: string) =>
    ipcRenderer.invoke("checkForUpdate", windowName),
  downloadUpdate: () => ipcRenderer.invoke("downloadUpdate"),
  quitAndInstall: () => ipcRenderer.invoke("quitAndInstall"),
};

window.ipcRenderer = withPrototype(ipcRenderer);

window.screenAPi = {
  allDisplays: () => ipcRenderer.invoke("getAllDisplays"),
  cursorPoint: () => ipcRenderer.invoke("get-cursor-screen-point"),
};

window.meetingNotice = {
  subNotice: (baseURL: string, token: string) =>
    ipcRenderer.invoke("sub-notice", { baseURL, token }),
  stopSubNotice: () => ipcRenderer.invoke("stop-sub-notice"),
};

window.fileSystem = {
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  openDirectory: (dirPath: string) =>
    ipcRenderer.invoke("open-directory", dirPath),
  getDefaultRecordPath: () => ipcRenderer.invoke("get-default-record-path"),
  setRecordSavePath: (savePath: string) =>
    ipcRenderer.invoke("set-record-save-path", savePath),
};
