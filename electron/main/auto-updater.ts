import https from "https";
import { app, BrowserWindow } from "electron";
import {
  AppUpdater as _AppUpdater,
  autoUpdater,
  UpdateInfo,
} from "electron-updater";

import log from "electron-log";

import config from "../../src/config/index";

export default class AppUpdater {
  autoUpdater: _AppUpdater = autoUpdater;

  constructor(mainWindow: BrowserWindow) {
    this.autoUpdater.removeAllListeners();

    autoUpdater.forceDevUpdateConfig = !app.isPackaged;
    autoUpdater.autoDownload = false;

    autoUpdater.setFeedURL(config.feedUrl);

    // 检测下载错误
    autoUpdater.on("error", (error) => {
      log.error("更新异常", error.message);

      mainWindow.webContents.send("update-error", error.message);
    });

    // 检测到有更新
    autoUpdater.on("update-available", (releaseInfo: UpdateInfo) => {
      let releaseNotes = "";

      https.get(`${config.feedUrl}/release-notes.md`, (response) => {
        response.on("data", (notesChunk) => {
          releaseNotes += notesChunk;
        });
        response.on("end", () => {
          try {
            mainWindow.webContents.send("update-available", {
              ...releaseInfo,
              releaseNotes,
            });
          } catch (err) {
            log.error("Send Message Error", err);
          }
        });
      });
    });

    // 检测到不需要更新时
    autoUpdater.on("update-not-available", () => {
      mainWindow.webContents.send("update-not-available");
    });

    // 更新下载进度
    autoUpdater.on("download-progress", (progress) => {
      log.info("download-progress--------");

      log.info(progress);

      mainWindow.webContents.send("download-progress", progress);
    });

    // 当需要更新的内容下载完成后
    autoUpdater.on("update-downloaded", () => {
      log.info("下载完成");

      mainWindow.webContents.send("update-downloaded");
    });

    this.autoUpdater = autoUpdater;
  }
}
