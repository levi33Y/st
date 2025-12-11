import { BrowserWindow, app, dialog, ipcMain, shell } from "electron";
import { isNil } from "lodash";
import { release } from "node:os";
import { join } from "node:path";
import { BrowserWindowConstructorOptions } from "../../src/renderer";
import "./download";
import "./ffmpeg";
import "./handle";
import { checkAndCleanup } from "./meeting-notice";
import "./report";
import { getNewWindowPoint, windowManage } from "./utils";

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
global.sharedData = {
  isUpdate: false,
};

process.env.DIST_ELECTRON = join(__dirname, "..");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");
const appEnv = process.env.VITE_APP_ENV || "development";

// //*添加vue-devtools
// const reactDevToolsPath = path.join(
//   os.homedir(),
//   "/Library/Application Support/Google/Chrome/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/6.6.1_74"
// );

// app.whenReady().then(async () => {
//   await session.defaultSession.loadExtension(reactDevToolsPath);
// });
//*
export async function createWindow() {
  if (win === null) {
    win = new BrowserWindow({
      title: "Main window",
      width: 375,
      height: 667,
      useContentSize: true,
      resizable: false,
      maximizable: false,
      show: false,
      titleBarStyle: "hidden",
      trafficLightPosition: {
        x: 12,
        y: 7,
      },
      icon: join(process.env.PUBLIC, "favicon.ico"),
      webPreferences: {
        preload,
        // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
        // Consider using contextBridge.exposeInMainWorld
        // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    windowManage.set({
      id: win.id,
      path: "/",
    });
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    // win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  win.on("ready-to-show", () => {
    win.show();
    if (process.env.VITE_DEV_SERVER_URL) {
      win.webContents.openDevTools();
    }
  });

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344

  win.on("closed", () => (win = null));
}

// 需要测试自动更新模块取消注销
// Object.defineProperty(app, "isPackaged", {
//   get() {
//     return true
//   },
// })

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  const win = BrowserWindow.getAllWindows()?.[0];
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
    allWindows[0].show();
  } else {
    createWindow();
  }
});

ipcMain.handle("open-main-win", () => {
  createWindow();
});

// New window example arg: new windows url
export function openWindow(
  arg: string,
  options: BrowserWindowConstructorOptions,
) {
  // 窗口已打开
  if (windowManage.has(arg)) {
    let win = BrowserWindow.fromId(windowManage.get(arg).id);

    if (win && !win.isDestroyed()) {
      win.webContents.send("win-load", {
        winId: win.id,
        path: arg,
      });

      win.focus();
    } else {
      windowManage.delete(arg);
    }

    return;
  }

  const parentWin = BrowserWindow.getFocusedWindow();

  const point = getNewWindowPoint(
    options?.width ?? 800,
    options?.height ?? 600,
  );

  const childWin = new BrowserWindow({
    icon: join(process.env.PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
    },
    ...point,
    ...options,
    parent: options?.parent ? parentWin : null,
    show: options?.show ?? false,
  });

  /* 打开更新窗口时禁用其他窗口 */
  if (arg.split("?")[0] === "/version-update") {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!isNil(childWin) && !win.isDestroyed() && win?.id !== childWin?.id) {
        win.setEnabled(false);
      }
    });
  }

  // Triggered by room window.open
  if (arg.split("?")[0] === "/trtc-room") {
    childWin.webContents.setWindowOpenHandler(
      ({ url, frameName, features }) => {
        const w = ["sharing-dropdown-menu"];

        const flag = w.some((item) => url.includes(item));

        if (flag) {
          childWin.webContents.on("did-create-window", (window, details) => {
            const path = details.url.split("#")[1];

            if (!windowManage.has(path)) {
              windowManage.set({
                id: window.id,
                path,
              });

              window.on("blur", () => {
                // StoreEventEnum.HideSharingMenuDropdown
                if (childWin && !childWin.isDestroyed()) {
                  childWin.webContents?.send("store-dispatch", 11);
                }

                window?.hide();
              });

              window.on("closed", () => {
                if (childWin && !childWin.isDestroyed()) {
                  try {
                    childWin.webContents.session.clearCache();
                  } catch (error) {
                    console.error("Failed to clear cache:", error);
                  }
                }

                windowManage.delete(path);

                setTimeout(() => checkAndCleanup(), 100);
              });
            }
          });

          return {
            action: "allow",
            overrideBrowserWindowOptions: {
              frame: false,
              useContentSize: true,
              resizable: false,
              immediate: false,
              show: false,
              skipTaskbar: true,
              closable: false,
              webPreferences: {
                preload,
                nodeIntegration: true,
                contextIsolation: false,
                webSecurity: true,
              },
            },
          };
        }

        return { action: "deny" };
      },
    );
  }

  childWin.on("closed", () => {
    const path = arg.split("?")[0];

    if (path === "/version-update") {
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.destroy();
        }
      });
    } else {
      if (path !== "/trtc-room") {
        setTimeout(() => checkAndCleanup(), 100);
      }

      windowManage.delete(arg);
    }
  });

  childWin.on("close", async (e) => {
    if (arg.split("?")[0] === "/version-update") {
      if (global.sharedData.isUpdate) return;

      e.preventDefault();

      const { response } = await dialog.showMessageBox({
        type: "question",
        buttons: ["确定退出", "取消"],
        title: "版本更新提示",
        message:
          "由於需要保證統一使用最新版本，因此若關閉當前窗口，則會關閉應用。",
        detail: "是否確定退出應用？",
        cancelId: 1,
      });

      if (response === 0) {
        childWin.removeAllListeners("close");
        app.exit(0);
      }
    } else {
      if (childWin && !childWin.isDestroyed()) {
        childWin.webContents.send("win-close", childWin.id);
      }
    }
  });

  childWin.on("ready-to-show", () => {
    if (arg.split("?")[0] === "/trtc-room") {
      childWin.setHasShadow(false);
    }

    if (isNil(options?.immediate) || options.immediate) {
      childWin.show();
    }
  });

  childWin.on("enter-full-screen", () => {
    childWin.webContents.send("enter-full-screen");
  });

  childWin.on("leave-full-screen", () => {
    childWin.webContents.send("leave-full-screen");
  });

  childWin.on("focus", () => {
    childWin.webContents.send("win-focus");
  });

  childWin.on("blur", () => {
    childWin.webContents.send("win-blur");
  });

  try {
    if (process.env.VITE_DEV_SERVER_URL) {
      childWin.loadURL(`${url}#${arg}`);
      childWin.webContents.openDevTools();
    } else {
      childWin.loadFile(indexHtml, { hash: arg });
      if (options?.openDevTools) {
        childWin.webContents.openDevTools();
      }
    }

    windowManage.set({
      id: childWin.id,
      path: arg,
    });
  } catch (error) {}

  return childWin;
}

ipcMain.handle(
  "open-win",
  (_, arg, options: BrowserWindowConstructorOptions) => {
    openWindow(arg, options);
  },
);

ipcMain.handle("getAppInfo", () => ({
  name: app.getName(),
  version: app.getVersion(),
  platform: process.platform,
}));
