import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { download } from "electron-dl";
import { exec } from "node:child_process";
import fs from "node:fs";
const path = require("node:path");

/* 用户配置的录制保存路径 */
let recordSavePath = "";

/* 选择文件夹 */
ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ["openDirectory", "createDirectory"],
    title: "選擇錄製保存路徑",
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }

  return null;
});

/* 打开文件夹 */
ipcMain.handle("open-directory", async (_, dirPath: string) => {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return { success: false, error: "路徑不存在" };
  }

  try {
    const command =
      process.platform === "win32"
        ? `explorer "${dirPath}"`
        : process.platform === "darwin"
        ? `open "${dirPath}"`
        : `xdg-open "${dirPath}"`;

    exec(command);

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

/* 获取默认录制路径 */
ipcMain.handle("get-default-record-path", () => {
  const downloadPath = app.getPath("downloads");

  const recordPath = path.join(downloadPath, "SugarTalk_Downloads");

  if (!fs.existsSync(recordPath)) {
    fs.mkdirSync(recordPath, { recursive: true });
  }

  return recordPath;
});

/* 设置录制保存路径 */
ipcMain.handle("set-record-save-path", (_, savePath: string) => {
  recordSavePath = savePath;
  return { success: true };
});

/* 下载视频 */
ipcMain.handle("download-video", async (_, urls: string[] | string) => {
  const win = BrowserWindow.getFocusedWindow();

  const list = Array.isArray(urls) ? urls : [urls];

  const downloadDirectory =
    recordSavePath ||
    path.join(app.getPath("downloads"), "SugarTalk_Downloads");

  if (!fs.existsSync(downloadDirectory)) {
    fs.mkdirSync(downloadDirectory, { recursive: true });
  }

  const succeeded: string[] = [];

  const failed: { url: string; error: string }[] = [];

  for (const url of list) {
    try {
      const item = await download(win!, url, {
        directory: downloadDirectory,
        saveAs: false,
      });

      const savePath =
        typeof item?.getSavePath === "function" ? item.getSavePath() : "";

      succeeded.push(savePath || url);
    } catch (e) {
      failed.push({ url, error: (e as Error).message });
    }
  }

  return {
    success: failed.length === 0,
    directory: downloadDirectory,
    succeeded,
    failed,
  };
});
