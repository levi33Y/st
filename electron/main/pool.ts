import { app, BrowserWindow } from "electron";
import { isNil } from "lodash";
import { join } from "node:path";
import { RoutePath } from "../../src/entity/types";
import { windowManage } from "./utils";
const preload = join(__dirname, "../preload/index.js");
const indexHtml = join(join(join(__dirname, ".."), "../dist"), "index.html");

export enum PoolMode {
  LRU = "LRU",

  IMMEDIATE_REFILL = "IMMEDIATE_REFILL",
}

export class PoolItem {
  id: number;

  instance: BrowserWindow = null;

  pool: WindowPool;

  createdAt: number;

  constructor(pool: WindowPool) {
    try {
      this.instance = new BrowserWindow({
        icon: join(process.env.PUBLIC, "favicon.ico"),
        webPreferences: {
          preload,
          nodeIntegration: true,
          contextIsolation: false,
          webSecurity: true,
        },
        frame: false,
        useContentSize: true,
        resizable: false,
        show: false,
        alwaysOnTop: true,
        width: 0,
        height: 0,
      });

      this.id = this.instance.id;

      this.pool = pool;

      this.createdAt = Date.now();
    } catch (error) {
      throw new Error(`BrowserWindow 创建失败: ${error.message}`);
    }
  }

  loadUrl(name: RoutePath, params: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const window = this.instance;

        if (!window || window.isDestroyed()) {
          reject(new Error("窗口实例不存在或已被销毁"));

          return;
        }

        const managePath = `${name}_${window.id}`;

        window.on("closed", () => {
          try {
            windowManage.delete(managePath);
          } catch (error) {
            console.error(`清理窗口 ${window.id} 时出错:`, error);
          }
        });

        window.webContents.once("did-finish-load", () => {
          try {
            windowManage.set({
              id: window.id,
              path: managePath,
            });

            resolve();
          } catch (error) {
            reject(error);
          }
        });

        window.webContents.once(
          "did-fail-load",
          (_, errorCode, errorDescription) => {
            reject(
              new Error(
                `页面加载失败: ${errorDescription} (错误码: ${errorCode})`,
              ),
            );
          },
        );

        const queryParams = {
          windowId: window.id,
          ...params,
        };

        const path = params
          ? `${name}?${Object.keys(queryParams)
              .map((key) => `${key}=${params[key]}`)
              .join("&")}`
          : name;

        if (process.env.VITE_DEV_SERVER_URL) {
          window
            .loadURL(`${process.env.VITE_DEV_SERVER_URL}#${path}`)
            .catch((error) => {
              reject(error);
            });
        } else {
          window.loadFile(indexHtml, { hash: path }).catch((error) => {
            reject(error);
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  destroy(): Promise<void> {
    const window = this.instance;

    return new Promise((resolve, reject) => {
      try {
        window?.on("closed", () => {
          resolve();
        });

        window?.destroy();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export class WindowPool {
  pool: Record<number, PoolItem> = {};

  protected mode: PoolMode = PoolMode.IMMEDIATE_REFILL;

  protected limit: number = 3;

  private isClearing: boolean = false;

  constructor(mode: PoolMode = PoolMode.IMMEDIATE_REFILL, limit?: number) {
    this.mode =
      mode === PoolMode.LRU ? PoolMode.LRU : PoolMode.IMMEDIATE_REFILL;

    if (!isNil(limit) && typeof limit === "number" && limit > 0) {
      this.limit = limit;
    }

    app.whenReady().then(() => {
      this.init();
    });

    // 监听应用退出事件，清理窗口池
    app.on("before-quit", async (event) => {
      console.log("--pool-quit---");

      if (Object.keys(this.pool).length > 0 && !this.isClearing) {
        event.preventDefault();

        this.isClearing = true;

        await this.clear();

        app.quit();
      }
    });
  }

  private init() {
    try {
      for (let i = 0; i < this.limit; i++) {
        this.add();
      }

      console.log(`初始化窗口池(${this.mode}模式)：${Object.keys(this.pool)}`);
    } catch (error) {
      throw error;
    }
  }

  async clear() {
    try {
      const windowIds = Object.keys(this.pool).map(Number);

      for (const windowId of windowIds) {
        await this.releaseWindow(windowId);
      }
    } catch (error) {
      throw error;
    }
  }

  getPoolWindowIds(): number[] {
    return Object.keys(this.pool).map(Number);
  }

  isPoolWindow(windowId: number): boolean {
    return this.pool[windowId] !== undefined;
  }

  add() {
    try {
      const window = new PoolItem(this);

      this.pool[window.id] = window;

      console.log(`补充窗口：${window.id}, 窗口：${Object.keys(this.pool)}`);
    } catch {}
  }

  delete(id: number) {
    try {
      delete this.pool[id];
    } catch {}
  }

  protected async releaseWindow(windowId: number) {
    try {
      const window = this.pool[windowId];

      if (window) {
        this.delete(windowId);
        await window.destroy();
      }
    } catch {}
  }

  /**
   * 等待新窗口创建完成（LRU）
   */
  private async waitForNewWindow(): Promise<PoolItem> {
    return new Promise((resolve, reject) => {
      try {
        this.add();

        const windows = Object.values(this.pool);

        if (windows.length === 0) {
          reject(new Error("无法创建新窗口，窗口池为空"));

          return;
        }

        const newWindow = windows[windows.length - 1];

        if (!newWindow || !newWindow.instance) {
          reject(new Error("新窗口实例无效"));

          return;
        }
        const timeout = setTimeout(() => {
          reject(new Error("等待新窗口创建超时"));
        }, 10000);

        newWindow.instance.once("ready-to-show", () => {
          clearTimeout(timeout);

          resolve(newWindow);
        });
      } catch (error) {
        console.error("等待新窗口创建失败:", error);

        reject(error);
      }
    });
  }

  /**
   * 获取最早创建的窗口（LRU）
   */
  private getOldestWindow(): PoolItem | null {
    try {
      const windows = Object.values(this.pool);

      if (windows.length === 0) return null;

      return windows.reduce((oldest, current) =>
        current.createdAt < oldest.createdAt ? current : oldest,
      );
    } catch (error) {
      return null;
    }
  }

  async use(): Promise<PoolItem> {
    try {
      if (this.mode === PoolMode.LRU) {
        // LRU模式：如果池满，先释放最早的窗口，等待新窗口创建完成
        if (Object.keys(this.pool).length >= this.limit) {
          const oldestWindow = this.getOldestWindow();

          if (oldestWindow) {
            this.releaseWindow(oldestWindow.id);
          }
        }

        const newWindow = await this.waitForNewWindow();

        if (!newWindow) {
          throw new Error("无法创建新窗口");
        }

        this.delete(newWindow.id);

        return newWindow;
      } else if (this.mode === PoolMode.IMMEDIATE_REFILL) {
        // IMMEDIATE_REFILL模式：立即返回窗口，然后补充
        const window = Object.values(this.pool).shift();

        if (!window) {
          throw new Error("窗口池为空，无法获取窗口");
        }

        this.delete(window.id);

        setImmediate(() => {
          try {
            this.add();
          } catch (error) {
            console.error("补充窗口失败:", error);
          }
        });

        return window;
      }
    } catch (error) {
      throw error;
    }
  }
}
