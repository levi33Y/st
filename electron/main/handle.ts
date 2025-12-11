import { exec } from "child_process";
import {
  BrowserWindow,
  Menu,
  MenuItem,
  MessageChannelMain,
  app,
  clipboard,
  desktopCapturer,
  dialog,
  ipcMain,
  nativeImage,
  screen,
  systemPreferences,
} from "electron";
import log from "electron-log";
import { isEmpty, isNil } from "lodash";
import loudness from "loudness";
import fs from "node:fs";
import path, { join } from "node:path";
import { v1 as uuidv1 } from "uuid";
import { BrowserWindowConstructorOptions } from "../../src/renderer";
import AppUpdater from "./auto-updater";
import { createWindow, openWindow } from "./index";
import { checkAndCleanup } from "./meeting-notice";
import { default as deviceTimer, default as timer } from "./Timer";
import { windowManage } from "./utils";

const roomPage = "/trtc-room";

ipcMain.handle("getPlatform", () => process.platform);

ipcMain.handle("getAllDisplays", () => screen.getAllDisplays());

ipcMain.handle("close-window", () => BrowserWindow.getAllWindows()[0]?.close());

ipcMain.handle("destroy-window", (_, path?: string) => {
  let win: BrowserWindow | null = null;

  if (isNil(path) || isEmpty(path)) {
    return;
  }

  try {
    const windowItem = windowManage.get(path);
    if (!windowItem) {
      return;
    }

    win = BrowserWindow.fromId(windowItem.id);

    if (!win || win.isDestroyed()) {
      return;
    }
  } catch {
    return;
  }

  if (path === roomPage) {
    win.once("closed", () => {
      checkAndCleanup();
    });
  }

  win.destroy();
});

ipcMain.handle("minimize-window", () =>
  BrowserWindow.getFocusedWindow().minimize(),
);

ipcMain.handle("maximize-window", () =>
  BrowserWindow.getFocusedWindow().maximize(),
);

ipcMain.handle("unmaximize-window", () =>
  BrowserWindow.getFocusedWindow().unmaximize(),
);

ipcMain.handle("focus-window", (_, path: string) => {
  const winItem = windowManage.get(path);
  if (winItem) {
    BrowserWindow.fromId(winItem.id).focus();
  }
});

ipcMain.handle(
  "getSources",
  (
    _,
    options: Electron.SourcesOptions,
  ): Promise<Electron.DesktopCapturerSource[]> =>
    desktopCapturer.getSources(options),
);

ipcMain.handle("setFullScreen", (_, flag: boolean) =>
  BrowserWindow.getFocusedWindow().setFullScreen(flag),
);

ipcMain.handle("getSize", (_, path?: string) => {
  if (path) {
    const windowItem = windowManage.get(path);
    return BrowserWindow.fromId(windowItem.id).getSize();
  } else {
    return BrowserWindow.getFocusedWindow().getSize();
  }
});

ipcMain.handle(
  "setSize",
  (_, width: number, height, animate?: boolean, path?: string) => {
    if (path) {
      const windowItem = windowManage.get(path);
      BrowserWindow.fromId(windowItem.id).setSize(width, height, animate);
    } else {
      BrowserWindow.getFocusedWindow().setSize(width, height, animate);
    }
  },
);

ipcMain.handle("window-manage", () => windowManage);

ipcMain.handle(
  "close-win-with-dialog",
  (_, options: Electron.MessageBoxSyncOptions) => {
    const win = BrowserWindow.getAllWindows()?.[0];
    win.on("close", (event) => {
      const index = dialog.showMessageBoxSync(win, options);
      if (index === (options?.cancelId ?? 1)) {
        event.preventDefault();
      } else {
        // 关闭窗口
        win.webContents.send("onCloseWindow");
      }
    });
  },
);

ipcMain.handle("block-win-close", (_, path: string) => {
  const win = BrowserWindow.fromId(windowManage.get(path)?.id);

  win.on("close", (event) => {
    event.preventDefault();
    // 关闭窗口
    win.webContents.send("onBlockWindowClose");

    win.on("closed", () => {
      checkAndCleanup();
    });
  });
});

ipcMain.handle("close-win-with-hide", () => {
  const win = BrowserWindow.getAllWindows()?.[0];
  win.on("close", (event) => {
    if (win.isFocused()) {
      win.hide();
      event.preventDefault();
    }
  });
});

ipcMain.handle("askForMediaAccess", (_, mediaType: "microphone" | "camera") =>
  systemPreferences.askForMediaAccess(mediaType),
);

ipcMain.handle(
  "getMediaAccessStatus",
  (_, mediaType: "microphone" | "camera" | "screen") =>
    systemPreferences.getMediaAccessStatus(mediaType),
);

ipcMain.handle(
  "showOpenDialogSync",
  (_, options: Electron.MessageBoxSyncOptions) =>
    dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), options),
);

//www.mbsplugins.de/archive/2020-04-05/MacOS_System_Preference_Links/monkeybreadsoftware_blog_archive
ipcMain.handle("execCommand", (_, command: string) => {
  exec(command);
});

ipcMain.handle("clipboard.writeText", (_, text: string) =>
  clipboard.writeText(text),
);

ipcMain.handle("clipboard.readImage", () => {
  const image = clipboard.readImage("clipboard");
  return image.toDataURL();
});

ipcMain.handle("store-dispatch", (_, id: string, hash: string) => {
  const wins = BrowserWindow.getAllWindows().filter((win) => {
    if (
      !win ||
      win.isDestroyed() ||
      !win.webContents ||
      win.webContents.isDestroyed()
    ) {
      return false;
    }

    return true;
  });

  for (let i = 0, win = null; (win = wins[i++]); ) {
    win.webContents.send("store-dispatch", id, hash);
  }
});

ipcMain.handle("loudness.getVolume", () => loudness.getVolume());

ipcMain.handle("loudness.setVolume", (_, volume: number) =>
  loudness.setVolume(volume),
);

ipcMain.handle("loudness.getMuted", () => loudness.getMuted());

ipcMain.handle("loudness.setMuted", (_, muted: boolean) =>
  loudness.setMuted(muted),
);

ipcMain.handle("get-local-audio-arraybuffer", () => {
  const path = join(process.env.PUBLIC, "horse.mp3");
  const buffer = fs.readFileSync(path);
  const arraybuffer = new Uint8Array(buffer);
  return arraybuffer.buffer;
});

ipcMain.handle("get-base64-by-filePath", async (_, filePath: string) => {
  const data = fs.readFileSync(filePath);
  return data.toString("base64");
});

ipcMain.handle("show-context-menu", (_, imageURL: string) => {
  const contextMenu = new Menu();
  contextMenu.append(
    new MenuItem({
      label: "复制",
      click: () => {
        const imageBuffer = Buffer.from(imageURL, "base64");
        const imageNative = nativeImage.createFromBuffer(imageBuffer);
        clipboard.writeImage(imageNative);
      },
    }),
  );
  contextMenu.append(
    new MenuItem({
      label: "另存为",
      click: () => {
        const appName = app.getName();
        const foramt = (num: number) => (num > 9 ? `${num}` : `0${num}`);
        const now = new Date();
        const year = now.getFullYear();
        const month = foramt(now.getMonth() + 1);
        const day = foramt(now.getDate());
        dialog
          .showSaveDialog({
            defaultPath: `${appName}_${year}${month}${day}_${uuidv1().substring(
              0,
              8,
            )}.png`,
          })
          .then((result) => {
            if (!result.canceled && result.filePath) {
              const savePath = result.filePath;

              const imageBuffer = Buffer.from(imageURL, "base64");

              fs.writeFile(savePath, imageBuffer, "base64", () => {});
            }
          });
      },
    }),
  );
  contextMenu.popup({ window: BrowserWindow.getFocusedWindow() });
});

ipcMain.handle("logout", () => {
  let mainWinId: number;
  windowManage.forEach((item, key) => {
    if (key === "/") {
      mainWinId = item.id;
    } else {
      BrowserWindow.fromId(item.id).destroy();
    }
  });
  if (mainWinId) {
    BrowserWindow.fromId(mainWinId).focus();
  } else {
    createWindow();
  }
});

ipcMain.handle("send-each-windows-message", async (_, url: string) => {
  const roomItem = windowManage.get(url);
  const roomWindow = BrowserWindow.fromId(roomItem?.id);
  if (roomWindow) {
    roomWindow.webContents.send("send-each-windows");
  }
});

ipcMain.handle("load-window", (event) => {
  event.sender.reload();
});

ipcMain.handle(
  "set-limit-size",
  async (
    _,
    path: string,
    limit?: Partial<{
      width: number;
      height: number;
      maxWidth: number;
      maxHeight: number;
      minWidth: number;
      minHeight: number;
      animate?: boolean;
    }>,
  ) => {
    if (!path) return;

    const win = BrowserWindow.fromId(windowManage.get(path).id);

    const { width = 300, height = 300 } = limit ?? {};

    const isResizable = win.isResizable();

    win.setResizable(true);

    const maxWidth = isNil(limit?.maxWidth)
      ? screen.getPrimaryDisplay().workAreaSize.width
      : width < limit?.maxWidth
      ? width
      : limit?.maxWidth;

    const maxHeight = isNil(limit?.maxHeight)
      ? screen.getPrimaryDisplay().workAreaSize.height
      : width < limit?.maxHeight
      ? width
      : limit?.maxHeight;

    const minWidth = isNil(limit?.minWidth) ? width : limit?.minWidth;

    const minHeight = isNil(limit?.minHeight) ? height : limit?.minHeight;

    win.setMaximumSize(maxWidth, maxHeight);

    win.setMinimumSize(minWidth, minHeight);

    win.setSize(width, height, limit?.animate);

    win.setResizable(isResizable);
  },
);

ipcMain.handle("channel-send-message", async (_, message: any) => {
  const targetWin = BrowserWindow.getFocusedWindow().getParentWindow();

  if (!targetWin) return;

  const { port1, port2 } = new MessageChannelMain();

  port2.postMessage(message);

  port2.close();

  targetWin.webContents.postMessage("main-give-message", null, [port1]);
});

ipcMain.handle("close-window-focus", async (_, path?: string) => {
  if (path) {
    const windowItem = windowManage.get(path);
    if (windowItem?.id) {
      BrowserWindow.fromId(windowItem.id).close();
    }
  } else {
    BrowserWindow.getFocusedWindow().close();
  }
});

ipcMain.handle(
  "get-primary-display",
  () => screen.getPrimaryDisplay().workAreaSize,
);

ipcMain.handle("set-penetrate", async (_, path, isIgnore) => {
  const win = BrowserWindow.fromId(windowManage.get(path).id);

  isIgnore
    ? win.setIgnoreMouseEvents(true, {
        forward: true,
      })
    : win.setIgnoreMouseEvents(false);
});

ipcMain.handle("get-win-size", async (_, path) => {
  const win = BrowserWindow.fromId(windowManage.get(path).id);

  const size = win.getSize();

  const position = win.getPosition();

  return {
    width: size[0],
    height: size[1],
    x: position[0],
    y: position[1],
  };
});

ipcMain.handle("hide-window", (_, path: string) => {
  const windowItem = windowManage.get(path);

  const win = BrowserWindow.fromId(windowItem.id);

  win?.hide();
});

ipcMain.handle("show-window", (_, path: string, p: [number, number]) => {
  const windowItem = windowManage.get(path);

  const win = BrowserWindow.fromId(windowItem.id);

  if (!isNil(p[0]) && !isNil(p[1])) {
    win.setPosition(Math.floor(p[0]), Math.floor(p[1]));

    win.show();

    win.focus();
  }
});

let commandPath = "";

if (process.env.VITE_DEV_SERVER_URL) {
  commandPath = path.join(app.getAppPath(), "public", "SwitchAudioSource");
} else {
  commandPath = path.join(process.resourcesPath, "SwitchAudioSource");
}

// 安装 BlackHole 2ch
ipcMain.handle("download-blackhole", async () => {
  return new Promise((res, rej) => {
    exec(`${commandPath} -a`, (error, stdout, stderr) => {
      if (error) {
        console.error("检查音频设备失败:", stderr || error.message);
        return rej("Error checking audio devices");
      }

      const devices = stdout.split("\n");
      const hasBlackHole = devices.some((device) =>
        device.includes("BlackHole 2ch"),
      );

      if (!hasBlackHole) {
        let pkgPath = "";

        if (process.env.VITE_DEV_SERVER_URL) {
          pkgPath = path.join(
            app.getAppPath(),
            "Public",
            "BlackHole2ch-0.6.0.pkg",
          );
        } else {
          pkgPath = path.join(process.resourcesPath, "BlackHole2ch-0.6.0.pkg");
        }

        log.transports.file.level = "info";

        log.info(pkgPath);

        exec(`open "${pkgPath}"`, (installError) => {
          if (installError) {
            console.error("安装失败:", installError.message);

            log.error(installError);
            return rej("Error installing BlackHole");
          }
        });
      } else {
        res("BlackHole 已安装");
      }
    });
  });
});

// 切换回默认设备
ipcMain.handle("switch-default", async () => {
  timer.stop();

  const VIRTUAL_KEYWORDS = [
    "Virtual",
    "VB-Cable",
    "BlackHole",
    "Loopback",
    "WeMeet",
  ];

  exec(`${commandPath} -t output -a`, (error, stdout, stderr) => {
    if (error) {
      console.error(`获取设备列表失败: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`错误信息: ${stderr}`);
      return;
    }

    const devices = stdout.split("\n").filter(Boolean);

    const targetDevice = devices.find(
      (device) => !VIRTUAL_KEYWORDS.some((keyword) => device.includes(keyword)),
    );

    if (targetDevice) {
      exec(
        `${commandPath} -t output -s "${targetDevice}"`,
        (err, out, errOut) => {
          if (err) {
            console.error(`切换失败: ${err.message}`);
            return;
          }
          if (errOut) {
            console.error(`错误信息: ${errOut}`);
            return;
          }
          console.log(`成功切换到设备: ${targetDevice}`);
        },
      );
    } else {
      console.warn("未找到非虚拟的输出设备");
    }
  });
});

ipcMain.handle("in-share-screen", async () => {
  const _cmd = () =>
    exec(`${commandPath} -t output -c`, (error, stdout) => {
      if (!error) {
        const currentOutput = stdout.trim();

        if (currentOutput !== "BlackHole 2ch") {
          exec(
            `${commandPath} -s "BlackHole 2ch"`,
            (switchError, switchStdout, switchStderr) => {
              if (switchError) {
                console.error(
                  "切换音频设备失败:",
                  switchStderr || switchError.message,
                );
              }
            },
          );
        }
      }
    });

  timer.stop();

  _cmd();

  timer.start(_cmd, 2000);
});

ipcMain.handle(
  "download-device",
  async (_, platform: "mac" | "win" | "other") => {
    return new Promise((res, rej) => {
      if (!platform || platform === "other") return rej("Not Supported");

      const vbApp =
        platform === "mac"
          ? "BlackHole2ch-0.6.0.pkg"
          : "VBCABLE_Driver_Pack45/VBCABLE_Setup_x64.exe";

      let exePath: string = "";

      if (process.env.VITE_DEV_SERVER_URL) {
        exePath = path.join(app.getAppPath(), "Public", vbApp);
      } else {
        exePath = path.join(process.resourcesPath, vbApp);
      }

      const cmd =
        platform === "mac"
          ? `open ${exePath}`
          : `powershell -Command ${exePath}`;

      exec(cmd, (error) => {
        return rej(error);
      });

      res("");
    });
  },
);

ipcMain.handle(
  "switch-device-win",
  async (
    _,
    target: "default" | "virtual",
    virtualDevice: string,
    defaultDevice: string,
  ) => {
    deviceTimer.stop();

    return new Promise((res, rej) => {
      if (!virtualDevice && !defaultDevice) {
        return rej("No device selected");
      }

      try {
        let cmdPath: string = "";

        if (process.env.VITE_DEV_SERVER_URL) {
          cmdPath = path.join(app.getAppPath(), "Public", "nircmd.exe");
        } else {
          cmdPath = path.join(process.resourcesPath, "nircmd.exe");
        }

        const _switch = (deviceLabel: string) => {
          exec(`${cmdPath} setdefaultsounddevice "${deviceLabel}"`, (error) => {
            rej(error?.stderr);
          });
        };

        if (target === "virtual") {
          _switch(virtualDevice);

          deviceTimer.start(() => _switch(virtualDevice), 2000);
        } else if (target === "default") {
          _switch(defaultDevice);
        }

        res("");
      } catch (e) {
        deviceTimer.stop();

        rej(e);
      }
    });
  },
);

ipcMain.handle("set-windows-button", async (_, path, visible) => {
  const win = BrowserWindow.fromId(windowManage.get(path).id);

  if (process.platform === "darwin") {
    win.setWindowButtonVisibility(visible);
  }
});

ipcMain.handle("set-fixed-win", async (_, path: string, isFixed?: boolean) => {
  const win = BrowserWindow.fromId(windowManage.get(path).id);

  win?.setMenuBarVisibility(!isFixed);

  win?.setVisibleOnAllWorkspaces(!isFixed);

  win?.setSkipTaskbar(isFixed);

  win?.setContentProtection(isFixed);
});

ipcMain.handle("set-resizable", async (_, path, resizable) => {
  const win = BrowserWindow.fromId(windowManage.get(path).id);

  win.setResizable(resizable);
});

ipcMain.handle("set-movable", async (_, path, movable) => {
  const win = BrowserWindow.fromId(windowManage.get(path).id);

  win.setMovable(movable);
});

ipcMain.handle("get-cursor-screen-point", async () =>
  screen.getCursorScreenPoint(),
);

ipcMain.handle("set-full-screen", async (_, path, full) => {
  const win = BrowserWindow.fromId(windowManage.get(path).id);

  win?.setSimpleFullScreen(full);
});

ipcMain.handle(
  "set-window-level",
  async (
    _,
    path,
    level?:
      | "normal"
      | "floating"
      | "torn-off-menu"
      | "modal-panel"
      | "main-menu"
      | "status"
      | "pop-up-menu"
      | "screen-saver",
  ) => {
    const win = BrowserWindow.fromId(windowManage.get(path).id);

    if (level) {
      win?.setAlwaysOnTop(true, level);
    } else {
      win?.setAlwaysOnTop(false);
    }
  },
);

/* 检查更新 */
ipcMain.handle("checkForUpdate", async (_, windowName: string) => {
  if (!app.isPackaged) {
    return;
  }

  const settingWindowItem = windowManage.get(windowName);

  const settingWindow = settingWindowItem
    ? BrowserWindow.fromId(settingWindowItem.id)
    : null;

  const { autoUpdater } = new AppUpdater(settingWindow);

  const update = await autoUpdater.checkForUpdates();

  return {
    currentVersion: autoUpdater.currentVersion,
    updateInfo: update?.updateInfo,
  };
});

/* 下载更新 */
ipcMain.handle("downloadUpdate", async () => {
  const updateWindowItem = windowManage.get("/version-update");

  const updateWindow = updateWindowItem
    ? BrowserWindow.fromId(updateWindowItem.id)
    : null;

  const { autoUpdater } = new AppUpdater(updateWindow);

  await autoUpdater.downloadUpdate();
});

/* 退出并重启 */
ipcMain.handle("quitAndInstall", async () => {
  const updateWindowItem = windowManage.get("/version-update");

  const updateWindow = updateWindowItem
    ? BrowserWindow.fromId(updateWindowItem.id)
    : null;

  global.sharedData.isUpdate = true;

  const { autoUpdater } = new AppUpdater(updateWindow);

  await autoUpdater.quitAndInstall();
});

ipcMain.handle(
  "re-open-win",
  async (_, path: string, options: BrowserWindowConstructorOptions) => {
    const p = path.split("?")[0];

    const win = BrowserWindow.fromId(windowManage.get(p).id);

    win?.on("closed", () => {
      openWindow(path, options);
    });

    win?.destroy();
  },
);
