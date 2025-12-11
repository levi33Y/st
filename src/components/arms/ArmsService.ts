import BrowserLogger from "@arms/js-sdk";
import arms from "../../arms";

export enum ArmsBehaviorEnum {
  MICROPHONE = "麦克风",
  SHARE_SCREEN = "共享屏幕",
  ROOM = "会议房间",
}

export interface IArmsSDKConfigProps {
  /*
   * https://help.aliyun.com/zh/arms/browser-monitoring/developer-reference/sdk-reference?spm=a2c4g.11186623.help-menu-34364.d_5_3.4e166676qNU8Dj&scm=20140722.H_58655._.OR_help-T_cn~zh-V_1#sc-release
   *
   */
  release: string;
  uid?: string;
  page: string;
  setUsername?: () => string;
  enableLinkTrace?: boolean;
  behavior?: boolean;
  enableSPA?: boolean;
  useFmp?: boolean;
  autoSendPerf?: boolean;
  /* 用作房间号 */
  c1: string;
}

/**
 * arms
 * 属性
 * https://help.aliyun.com/zh/arms/browser-monitoring/developer-reference/sdk-reference?spm=a2c4g.11186623.help-menu-34364.d_5_3.4e166676qNU8Dj&scm=20140722.H_58655._.OR_help-T_cn~zh-V_1
 * 方法
 * https://help.aliyun.com/zh/arms/browser-monitoring/developer-reference/api-reference?spm=a2c4g.11186623.help-menu-34364.d_5_2.78b04cf95JDDE5&scm=20140722.H_58657._.OR_help-T_cn~zh-V_1
 */
export class ArmsService {
  instance: any;

  router: string = "";

  constructor() {}

  bindInstance(sdkConfig: IArmsSDKConfigProps) {
    if (this.instance) {
      console.log("ArmsService already initialized");

      return;
    }

    let config = {
      enableLinkTrace: true,
      behavior: true,
      useFmp: true,
      enableSPA: false,
      autoSendPerf: false,
      // disableHook: true,
      ...sdkConfig,
    } as any;

    if (arms?.pid) {
      config.pid = arms?.pid;

      config.environment = arms.environment;
    } else if (import.meta.env.VITE_ARMS_PID) {
      config.pid = import.meta.env.VITE_ARMS_PID;

      config.environment = "local";
    }

    console.log("Init ArmsService", config);

    if (config?.pid) {
      this.router = config?.page;

      this.instance = BrowserLogger.singleton(config, [
        ["api", config.page, true, Date.now(), "SUCCESS"],
      ]);
    }
  }

  addBehavior<T extends ArmsBehaviorEnum>(type: T, message: string) {
    this.instance?.addBehavior({
      data: {
        name: type,
        message,
      },
      page: this.router,
    });

    this.instance?.reportBehavior();
  }

  addApi(msg: string, success: boolean = true) {
    armsService.instance.api(
      armsService.router,
      success,
      Date.now(),
      success ? "SUCCESS" : "ERROR",
      msg,
    );
  }
}

export const armsService = new ArmsService();
