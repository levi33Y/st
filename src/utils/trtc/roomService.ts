import {
  DataChannelCommand,
  IMsgGrpTipMessageProps,
  MsgGrpTip,
} from "@/entity/enum";
import { OnlineTypeEnum } from "@/entity/response";
import { ITencentKeyResponseProps } from "@/services/apis/trtc/types";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { WhiteboardEventEnum } from "@/utils/trtc/hook/useMitt";
import useGetRoomEngine from "@/utils/trtc/hook/useRoomTRTCCloud";
import { MediaManager } from "@/utils/trtc/manager/mediaManager";
import { RoomActionManager } from "@/utils/trtc/manager/roomActionManager";
import { UserManager } from "@/utils/trtc/manager/userManager";
import { useBasicStore } from "@/utils/trtc/store/basic";
import { useMediaStore } from "@/utils/trtc/store/media";
import { useRoomStore } from "@/utils/trtc/store/room";
import TencentCloudChat, { ChatSDK, Message } from "@tencentcloud/chat";
import { isNil } from "lodash";
import mitt from "mitt";
import TRTCCloud, { TRTCAudioQuality, TRTCDeviceType } from "trtc-electron-sdk";

export type WhiteboardDataType = Record<string, any>;

export enum RoomEventEnum {
  NET_STATE_CONNECTED = "NET_STATE_CONNECTED",
  NET_STATE_CONNECTING = "NET_STATE_CONNECTING",
  NET_STATE_DISCONNECTED = "NET_STATE_DISCONNECTED",
  MSG_TEXT = "MSG_TEXT",
  WHITEBOARD_EVENT = "WHITEBOARD_EVENT",
  MESSAGE_SENT_SUCCESSFULLY = "MESSAGE_SENT_SUCCESSFULLY",
  MESSAGE_SENT_ERROR = "MESSAGE_SENT_ERROR",
  PERMISSION_UPDATED = "PERMISSION_UPDATED",
  RECORD_UPDATE = "RECORD_UPDATE",
  KICKED_OUT = "KICKED_OUT",
  TEDU_BOARD_SYNC_DATA = "TEDU_BOARD_SYNC_DATA",
  ON_ENTER_ROOM = "ON_ENTER_ROOM",
  PROFILE_UPDATED = "PROFILE_UPDATED",
  ROOM_MEMBER_UPDATE = "ROOM_MEMBER_UPDATE",
  SECURE_UPDATE = "SECURE_UPDATE",
  END_MEETING = "END_MEETING",
  LOGOUT = "LOGOUT",
  /**
   *  白板的自定义消息
   */
  TXWhiteBoardExt = "TXWhiteBoardExt",
  /**
   * 白板操作
   */
}

export interface IRoomEventProps {
  [RoomEventEnum.WHITEBOARD_EVENT]: WhiteboardEventEnum;
  [RoomEventEnum.TXWhiteBoardExt]: WhiteboardDataType;
  [RoomEventEnum.RECORD_UPDATE]: boolean;
  [key: string]: any;
}

export interface IRoomServiceProps {
  TRTCCloud: TRTCCloud;
  chat: ChatSDK;
  basicStore: ReturnType<typeof useBasicStore>;
  roomStore: ReturnType<typeof useRoomStore>;
  mediaStore: ReturnType<typeof useMediaStore>;
  userManager: UserManager;
  mediaManager: MediaManager;
  roomAction: RoomActionManager;
  on: (eventType: RoomEventEnum, callback: (data?: any) => any) => this;
  off: (eventType: RoomEventEnum, callback: (data?: any) => void) => this;
  emit: (eventType: RoomEventEnum, data?: any) => void;
  destroy: () => void;
}

export const roomEngine = useGetRoomEngine();

export class RoomService implements IRoomServiceProps {
  TRTCCloud: TRTCCloud = roomEngine.TRTCCloudInstance as TRTCCloud;

  chat: ChatSDK = roomEngine.ChatInstance as ChatSDK;

  userManager: UserManager = new UserManager(this);

  mediaManager: MediaManager = new MediaManager(this);

  roomAction: RoomActionManager = new RoomActionManager(this);

  private emitter = mitt<Record<RoomEventEnum, IRoomEventProps>>();

  get basicStore() {
    return useBasicStore();
  }

  get roomStore() {
    return useRoomStore();
  }

  get mediaStore() {
    return useMediaStore();
  }

  constructor() {}

  on<T extends RoomEventEnum>(
    eventType: T,
    callback: (data?: IRoomEventProps[T]) => void | Promise<void>,
  ) {
    this.emitter?.on(eventType, callback);

    return this;
  }

  off(
    eventType: RoomEventEnum,
    callback: (data?: any) => void | Promise<void>,
  ) {
    this.emitter?.off(eventType, callback);

    return this;
  }

  emit<T extends RoomEventEnum>(eventType: T, data?: IRoomEventProps[T]) {
    this.emitter?.emit(eventType, data!);

    return this;
  }

  private bindTRTCCloudEvents() {
    const _this = this;

    this.TRTCCloud.on("onError", (errCode: number, errMsg: string) => {
      console.log(`App.vue onError:`, errCode, errMsg);
    })
      // 等待
      .on("onWarning", (code: number, msg: string, extra: any) => {
        console.log(`App.vue onWarning:`, code, msg, extra);
      })
      // 進入房間
      .on("onEnterRoom", (result: string) => {
        console.log(`App.vue onEnterRoom:`, result + "ms");

        this.TRTCCloud.startLocalAudio(TRTCAudioQuality.TRTCAudioQualitySpeech);

        this.mediaManager.setMicrophoneEnabled(false);

        let setting = this.roomStore.applicationSettingInfo;

        let meetingSetting = this.roomStore.meetingSetting;

        // app setting - schedule meeting setting - waitRoom meeting setting
        let isMicEnable = meetingSetting?.microphoneEnable ?? false;

        let isCameraEnable = meetingSetting?.cameraEnable ?? false;

        if (
          isNil(meetingSetting.microphoneEnable) &&
          isNil(meetingSetting.cameraEnable)
        ) {
          if (meetingSetting.isMute) {
            isMicEnable = false;

            isCameraEnable = false;
          } else {
            isMicEnable = setting?.microphoneEnable ?? false;

            isCameraEnable = setting?.cameraEnable ?? false;
          }
        }

        this.roomStore?.applicationSettingInfo?.speakerDevice &&
          this.mediaManager.switchSpeakerDevice(
            this.roomStore.applicationSettingInfo.speakerDevice,
          );

        this.roomStore?.applicationSettingInfo?.microphoneEnable &&
          this.mediaManager.switchMicDevice(
            this.roomStore.applicationSettingInfo.microphoneDevice,
          );

        this.mediaManager.setMicrophoneEnabled(isMicEnable);

        this.mediaManager.setCameraEnabled(isCameraEnable);

        this.emit(RoomEventEnum.ON_ENTER_ROOM);
      })
      // 离开房间
      .on("onExitRoom", (reason: number) => {
        const room = _this.roomStore.meeting.meetingNumber;

        if (reason == 0) {
          console.log(
            "Exit current room by calling the 'exitRoom' api of sdk ...",
          );
        } else if (reason == 1) {
          console.log(
            "Kicked out of the current room by server through the restful api...",
          );

          //   rust api
          /*          _this.roomAction.quitGroup(room).finally(() => {
            _this.roomAction.publishData<MsgGrpTipMessage>({
              command: DataChannelCommand.MSG_GRP_TIP,
              message: {
                type: MsgGrpTip.GRP_TIP_MBR_QUIT,
                sid: userID,
              },
            });

            _this.roomAction.logout();*/
        } else if (reason == 2) {
          console.log(
            "Current room is dissolved by server through the restful api...",
          );

          _this.roomAction.quitGroup(room).finally(() => {
            _this.roomAction.logout();
          });
        }
      })
      // 有用户加入当前房间
      .on("onRemoteUserEnterRoom", (userId: string) => {
        console.log(`App.vue onRemoteUserEnterRoom:`, userId);

        _this.userManager.updateUser(userId, {
          status: OnlineTypeEnum.Online,
        });

        _this.emit(RoomEventEnum.PROFILE_UPDATED);
      })
      // 有用户离开当前房间
      .on("onRemoteUserLeaveRoom", (userId: string, reason: number) => {
        console.log(`App.vue onRemoteUserLeaveRoom:`, userId, reason);

        _this.userManager.updateUser(userId, {
          status: OnlineTypeEnum.OutMeeting,
        });

        this.emit(RoomEventEnum.PERMISSION_UPDATED);
      })
      // 用户是否开启摄像头视频
      .on("onUserVideoAvailable", (userId: string, available: 1 | 0) => {
        console.log(`App.vue onUserVideoAvailable:`, userId, available);

        this.userManager.updateCameraAvailable(userId, available);
      })
      // 用户是否开启屏幕分享。
      .on("onUserSubStreamAvailable", (userId: string, available: 1 | 0) => {
        console.log(`App.vue onUserSubStreamAvailable:`, userId, available);

        this.userManager.updateScreenShareAvailable(userId, available);
      })
      // 用户是否开启音频上行。
      .on("onUserAudioAvailable", (userId: string, available: 1 | 0) => {
        console.log(`App.vue onUserAudioAvailable:`, userId, available);

        this.userManager.updateMicroPhoneAvailable(userId, available);
      })
      // 用于提示音量大小的回调，包括每个 userId 的音量和远端总音量；本地用户 userid 为''。
      .on(
        "onUserVoiceVolume",
        (
          userVolumes: Array<any>,
          userVolumesCount: number,
          totalVolume: number,
        ) => {
          /*         console.log(
            `App.vue onUserVoiceVolume:`,
            userVolumes,
            userVolumesCount,
            totalVolume,
          );*/

          this.userManager.updateSpeakInfo(
            userVolumes,
            userVolumesCount,
            totalVolume,
          );
        },
      )
      .on("onDeviceChange", (_, type) => {
        switch (type) {
          case TRTCDeviceType.TRTCDeviceTypeMic: {
            this.mediaManager.updateMicDevice();

            break;
          }
          case TRTCDeviceType.TRTCDeviceTypeSpeaker: {
            this.mediaManager.updateSpeakerDevice();

            break;
          }
          case TRTCDeviceType.TRTCDeviceTypeCamera: {
            this.mediaManager.updateCamera();

            break;
          }
          default: {
            break;
          }
        }
      });
  }

  private bindChatEvents() {
    const _this = this;

    const chat = this.chat;

    let onSdkReady = function (event: any) {
      /*     let message = chat.createTextMessage({ to: 'user1', conversationType: 'C2C', payload: { text: 'Hello world!' }});
      chat.sendMessage(message);*/

      console.log("---Chat SDK_READY---");

      const group = _this.roomStore.meeting.meetingNumber;

      _this.roomAction.joinGroup({
        groupID: group,
      });
    };
    chat.on(TencentCloudChat.EVENT.SDK_READY, onSdkReady);

    let onSdkNotReady = function (event: any) {
      // 如果想使用发送消息等功能，接入侧需驱动 SDK 进入 ready 状态，重新调用 login 接口即可，如下所示：
      // chat.login({userID: 'your userID', userSig: 'your userSig'});
      console.log("onSdkNotReady", "----", event);
    };
    chat.on(TencentCloudChat.EVENT.SDK_NOT_READY, onSdkNotReady);

    let onNetStateChange = function (event: any) {
      // event.data.state 当前网络状态，枚举值及说明如下：
      // TencentCloudChat.TYPES.NET_STATE_CONNECTED - 已接入网络
      // TencentCloudChat.TYPES.NET_STATE_CONNECTING - 连接中。很可能遇到网络抖动，SDK 在重试。接入侧可根据此状态提示“当前网络不稳定”或“连接中”
      // TencentCloudChat.TYPES.NET_STATE_DISCONNECTED - 未接入网络。接入侧可根据此状态提示“当前网络不可用”。SDK 仍会继续重试，若用户网络恢复，SDK 会自动同步消息

      // 网络状态发生改变
      // event.name - TencentCloudChat.EVENT.NET_STATE_CHANGE
      switch (event.data.state) {
        case TencentCloudChat.TYPES.NET_STATE_CONNECTED:
          _this.emit(RoomEventEnum.NET_STATE_CONNECTED);
          break;
        case TencentCloudChat.TYPES.NET_STATE_CONNECTING:
          _this.emit(RoomEventEnum.NET_STATE_CONNECTING);
          break;
        case TencentCloudChat.TYPES.NET_STATE_DISCONNECTED:
          _this.emit(RoomEventEnum.NET_STATE_DISCONNECTED);
          break;
      }
    };
    chat.on(TencentCloudChat.EVENT.NET_STATE_CHANGE, onNetStateChange);

    let onProfileUpdated = function (event: any) {
      console.log("PROFILE_UPDATED", event.data); // 包含 Profile 对象的数组
      // Profile 数据结构详情请参考 https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Profile.html

      _this.emit(RoomEventEnum.PROFILE_UPDATED);
    };
    chat.on(TencentCloudChat.EVENT.PROFILE_UPDATED, onProfileUpdated);

    let msgGrpTip = function (
      { type, sid }: IMsgGrpTipMessageProps = {} as IMsgGrpTipMessageProps,
    ) {
      switch (type) {
        case MsgGrpTip.GRP_TIP_MBR_JOIN: {
          _this.emit(RoomEventEnum.PERMISSION_UPDATED);

          break;
        }
        case MsgGrpTip.GRP_TIP_GRP_PROFILE_UPDATED: {
          break;
        }
        case MsgGrpTip.GRP_TIP_MBR_KICKED_OUT: {
          break;
        }
        case MsgGrpTip.GRP_TIP_MBR_QUIT: {
          sid &&
            _this.userManager.updateUser(sid, {
              status: OnlineTypeEnum.OutMeeting,
            });

          _this.emit(RoomEventEnum.PERMISSION_UPDATED);
          break;
        }
        default: {
          break;
        }
      }

      _this.emit(RoomEventEnum.PROFILE_UPDATED);
    };

    let onMessageReceived = function (event: any) {
      // event.data - 存储 Message 对象的数组 - [Message]
      // Message 数据结构详情请参考 https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html
      const messageList = event.data as Message[];

      const roomNumber = _this.roomStore?.meeting?.meetingNumber;

      const localUser = _this.roomStore?.localUser ?? {};

      messageList.forEach((message: Message) => {
        if (!roomNumber || message.to !== roomNumber) {
          console.log("过滤不是当前群组信息");

          return;
        }

        // 消息类型
        if (message.type === TencentCloudChat.TYPES.MSG_TEXT) {
          // 文本消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.TextPayload
          const { text } = message.payload;

          let data = text;

          let isEffective = false;

          try {
            data = JSON.parse(text);

            if (!data?.destination) {
              isEffective = true;
            } else if (data?.destination && data.destination?.length === 0) {
              isEffective = true;
            } else if (data.destination?.length > 0) {
              isEffective = data.destination.some(
                (item: string) => item == localUser.sid,
              );
            }
          } catch {}

          // 文本消息
          console.log(data);

          if (data?.command === DataChannelCommand.MSG_GRP_TIP) {
            msgGrpTip(data?.message as IMsgGrpTipMessageProps);
          }

          isEffective && _this.emitter.emit(RoomEventEnum.MSG_TEXT, data);
        } else if (message.type === TencentCloudChat.TYPES.MSG_IMAGE) {
          // 图片消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.ImagePayload
        } else if (message.type === TencentCloudChat.TYPES.MSG_AUDIO) {
          // 音频消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.AudioPayload
        } else if (message.type === TencentCloudChat.TYPES.MSG_VIDEO) {
          // 视频消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.VideoPayload
        } else if (message.type === TencentCloudChat.TYPES.MSG_FILE) {
          // 文件消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.FilePayload
        } else if (message.type === TencentCloudChat.TYPES.MSG_CUSTOM) {
          // 自定义消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.CustomPayload
        } else if (message.type === TencentCloudChat.TYPES.MSG_MERGER) {
          // 合并消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.MergerPayload
        } else if (message.type === TencentCloudChat.TYPES.MSG_LOCATION) {
          // 地理位置消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.LocationPayload
        } else if (message.type === TencentCloudChat.TYPES.MSG_GRP_TIP) {
          // 群提示消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.GroupTipPayload
        } else if (message.type === TencentCloudChat.TYPES.MSG_GRP_SYS_NOTICE) {
          // 群系统通知 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.GroupSystemNoticePayload
          const { operationType, userDefinedField } = message.payload;
          // operationType - 操作类型
          // userDefinedField - 用户自定义字段（对应 operationType 为 255）
          // 使用 RestAPI 在群组中发送系统通知时，接入侧可从 userDefinedField 拿到自定义通知的内容。
        }

        // 消息所属会话的类型
        if (message.conversationType === TencentCloudChat.TYPES.CONV_GROUP) {
          // 如果是当前课堂，这里需要注意一定只能接受当前课堂群组的信令。
          // 如果用户加入多个im群组，恰巧这几个群组也在上课，白板信令则会多个课堂错乱，引发互动白板不能同步的异常行为。
          let elements = (message as any).getElements();

          if (!elements && !elements.length) {
            return;
          }

          elements.forEach((element: any) => {
            // 自定义消息
            if (element.type === "TIMCustomElem") {
              // 是白板的自定义消息
              if (element.content.extension === "TXWhiteBoardExt") {
                // 并且发消息的人不是自己
                if (message.from == localUser.sid) {
                  console.log("过滤自己本人的操作信令");

                  return;
                }

                _this.emit(RoomEventEnum.TXWhiteBoardExt, element.content.data);
              }
            }
          });
        }
      });
    };
    chat.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onMessageReceived);
  }

  bindAppSetting(data: ReturnType<typeof useSettingsStore>) {
    this.roomStore.applicationSettingInfo = {
      cameraEnable: data.enableCamera,
      microphoneEnable: data.enableMicrophone,
      showMeetingDuration: data.showMeetingDuration,
      microphoneDevice: data.audioInputDeviceId,
      speakerDevice: data.audioOutputDeviceId,
    };
  }

  bind(data: ITencentKeyResponseProps, callback?: (data?: any) => void) {
    try {
      this.basicStore.setSDKApp(data.appId, data.sdkSecretKey);

      this.TRTCCloud = roomEngine.TRTCCloudInstance as TRTCCloud;

      this.mediaManager.updateMicDevice();

      this.mediaManager.updateCamera();

      this.mediaManager.updateSpeakerDevice();

      this.chat = roomEngine.ChatInstance as ChatSDK;

      this.bindTRTCCloudEvents();

      this.bindChatEvents();

      this.mediaManager = new MediaManager(this);

      this.userManager = new UserManager(this);

      this.roomAction = new RoomActionManager(this);

      console.log("sdk ready");

      callback && callback();
    } catch (err) {
      console.log("sdk error");

      callback && callback(err);
    }
  }

  destroy() {
    // (this.TRTCCloud as any)?.destroyTRTCShareInstance();
    // this.chat?.destroy();
  }
}

export const roomService = new RoomService();
