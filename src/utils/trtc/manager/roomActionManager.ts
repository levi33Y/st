import {
  DataChannelCommand,
  DataChannelNotifyType,
  IMsgGrpTipMessageProps,
  MeetingAppointmentType,
  MeetingRepeatType,
  MsgGrpTip,
} from "@/entity/enum";
import { OnlineTypeEnum } from "@/entity/response";
import { DataChannelMessage, DataChannelNotify } from "@/entity/types";
import { JoinMeetingResponse } from "@/services/apis/meeting/types";
import genTestUserSig from "@/utils/trtc/config/gen-test-user-sig";
import {
  IRoomServiceProps,
  RoomEventEnum,
  WhiteboardDataType,
} from "@/utils/trtc/roomService";
import {
  IMeetingInfoProps,
  IMeetingSettingInfoProps,
  IRecordingInfoProps,
  ISecurityProps,
  UserRoleEnum,
} from "@/utils/trtc/store/room";
import { ArmsBehaviorEnum, armsService } from "@components/arms/ArmsService";
import TencentCloudChat from "@tencentcloud/chat";
import { RemoteParticipant } from "livekit-client";
import { isNil } from "lodash";
import { TRTCAppScene, TRTCParams } from "trtc-electron-sdk";

interface IRoomActionManagerProps {}

export class RoomActionManager implements IRoomActionManagerProps {
  private service: IRoomServiceProps;

  constructor(service: IRoomServiceProps) {
    this.service = service;

    this.bindMessageEvent();
  }

  private bindMessageEvent() {
    const _this = this;

    this.service.on(RoomEventEnum.MSG_TEXT, (data: any) => {
      const command = data?.command;

      switch (command) {
        case DataChannelCommand.Notify: {
          const { type = "" as DataChannelNotifyType }: DataChannelNotify =
            data?.message;

          switch (type) {
            case DataChannelNotifyType.EndMeeting:
              _this.service.emit(RoomEventEnum.END_MEETING);
            default: {
              break;
            }
          }

          break;
        }
        case DataChannelCommand.Recording: {
          const {
            meetingRecordId = "",
            taskId = "",
            isRecording,
          } = data?.message ?? {};

          const val = isNil(isRecording)
            ? !_this.service.roomStore.isRecording
            : isRecording;

          val
            ? _this.service.roomAction.startRecording({
                taskId,
                meetingRecordId,
              })
            : _this.service.roomAction.stopRecording();
          break;
        }
        case DataChannelCommand.UpdateSecure: {
          this.service.emit(RoomEventEnum.SECURE_UPDATE);
          break;
        }
        default: {
          break;
        }
      }
    });
  }

  enter(params: {
    roomId: number;
    userId: string;
    userName: string;
    role?: UserRoleEnum;
  }) {
    const TRTCCloud = this.service.TRTCCloud;

    const userSid = `${params.userName}_${params.userId}`;

    const { SDKAppID, SDKSecretKey } = this.service.basicStore.sdk;

    const { userSig } = genTestUserSig(userSid, Number(SDKAppID), SDKSecretKey);

    const param = new TRTCParams();

    param.userId = userSid;

    param.roomId = Number(params.roomId);

    param.sdkAppId = SDKAppID;

    param.userSig = userSig;

    this.service.userManager.updateUser(userSid, {
      status: OnlineTypeEnum.Online,
      role: isNil(params.role) ? UserRoleEnum.Participant : params.role,
    });

    TRTCCloud.enterRoom(param, TRTCAppScene.TRTCAppSceneVideoCall);

    TRTCCloud.enableAudioVolumeEvaluation(300);

    armsService.addBehavior(ArmsBehaviorEnum.ROOM, "进入了房间");
  }

  out() {
    this.service.TRTCCloud?.exitRoom();
  }

  login(params: { userId: string; userName: string }): Promise<{
    userSid: string;
    userSig: string;
  }> {
    const chat = this.service.chat;

    const userSid = `${params.userName}_${params.userId}`;

    const { SDKAppID, SDKSecretKey } = this.service.basicStore.sdk;

    const { userSig } = genTestUserSig(userSid, Number(SDKAppID), SDKSecretKey);

    return chat
      .login({
        userID: userSid,
        userSig,
      })
      .then((res) => {
        console.log("✅ login 成功", res, chat.getLoginUser());

        this.service.userManager.insertUser(userSid, true);

        return {
          userSid: userSid,
          userSig,
        };
      })
      .catch((err) => {
        console.error("❌ login 失败", err);

        return err;
      });
  }

  logout() {
    const _this = this;

    this.service.chat
      .logout()
      .then((res) => {
        console.log("✅ logout 成功", res);
      })
      .catch((err) => {
        console.error("❌ logout 失败", err);
      })
      .finally(() => {
        _this.service.destroy();

        _this.service.emit(RoomEventEnum.LOGOUT);
      });
  }

  joinGroup(params: { groupID: string }) {
    const _this = this;

    const _service = this.service;

    const chat = this.service.chat;

    const group = params.groupID;

    const userSid = _service.roomStore.localUser.sid;

    if (!params.groupID) {
      console.error("❌ 创建群组失败 groupID Null");
    }

    const updateNickName = () => {
      _service.userManager.updateNickName(
        _service.roomStore.localUser?.name ?? "",
      );

      _service.emit(RoomEventEnum.PROFILE_UPDATED);

      _service.roomAction.publishData<IMsgGrpTipMessageProps>({
        command: DataChannelCommand.MSG_GRP_TIP,
        message: {
          type: MsgGrpTip.GRP_TIP_MBR_JOIN,
          sid: userSid,
        },
      });
    };

    let promise = chat.joinGroup(params);
    promise
      .then(function (imResponse) {
        switch (imResponse.data.status) {
          case TencentCloudChat.TYPES.JOIN_STATUS_WAIT_APPROVAL: // 等待管理员同意
            break;
          case TencentCloudChat.TYPES.JOIN_STATUS_SUCCESS: // 加群成功
            console.log("✅加入群组成功", imResponse.data.group); // 加入的群组资料
            break;
          case TencentCloudChat.TYPES.JOIN_STATUS_ALREADY_IN_GROUP: // 已经在群中
            break;
          default:
            break;
        }

        updateNickName();
      })
      .catch(function (imError) {
        switch (imError.code) {
          case 10015: {
            console.log("⚠️ 群组不存在，尝试创建");

            chat
              .createGroup({
                groupID: params.groupID as string,
                name: `会议 ${params.groupID}`,
                type: TencentCloudChat.TYPES.GRP_MEETING,
              })
              .then(() => {
                console.log("✅ 创建群组成功，自动加入");
                return chat.joinGroup({
                  groupID: params.groupID,
                });

                updateNickName();
              })
              .catch((createErr) => {
                console.error("❌ 创建群组失败", createErr);
              });

            break;
          }
          case 10013: {
            console.log("⚠️ 用户已经是群成员");

            updateNickName();

            break;
          }
          default: {
            console.error("❌ 其他加入失败", imError);

            break;
          }
        }
      })
      .finally(() => {});
  }

  async quitGroup(meetingNumber?: string) {
    const room =
      meetingNumber ?? this.service?.roomStore?.meeting?.meetingNumber;

    const localSid = this.service.roomStore.localUser?.sid;

    const res = await this.service.chat.getGroupProfile({
      groupID: room,
    });

    // ⚠️ 该群不允许群主主动退出
    if (
      res?.data?.group?.ownerID &&
      localSid &&
      res.data.group.ownerID != localSid
    ) {
      this.service.chat
        .quitGroup(room)
        .then(function (imResponse) {
          console.log(imResponse.data.groupID); // 退出成功的群 ID
        })
        .catch(function (imError) {
          switch (imError.code) {
            case 10009: {
              console.log("⚠️ 该群不允许群主主动退出。");
            }
            default: {
              console.warn("quitGroup error:", imError); // 退出群组失败的相关信息
            }
          }
        });
    }
  }

  leave(meetingNumber?: string) {
    this.service.roomAction.publishData<IMsgGrpTipMessageProps>({
      command: DataChannelCommand.MSG_GRP_TIP,
      message: {
        type: MsgGrpTip.GRP_TIP_MBR_QUIT,
        sid: this.service.roomStore.localUser.sid,
      },
    });

    this.quitGroup(meetingNumber).finally(() => {
      this.logout();
    });
  }

  startRecording(state: Partial<IRecordingInfoProps>) {
    this.service.roomStore.updateRecordInfo({
      ...state,
      isRecording: true,
    });
  }

  stopRecording() {
    this.service.roomStore.updateRecordInfo({
      taskId: "",
      meetingRecordId: "",
      speakId: "",
      speakStartTime: 0,
      isRecording: false,
    });
  }

  startSpeaking(state: IRecordingInfoProps) {
    const info = this.service.roomStore.recordingInfo;

    this.service.roomStore.updateRecordInfo({
      ...info,
      speakId: state.speakId,
      speakStartTime: state.speakStartTime,
    });
  }

  initMeetingInfo({
    meeting,
    isEntryWaitingRoom,
    taskId,
  }: JoinMeetingResponse) {
    this.service.roomStore.updateMeetingInfo({
      meetingId: meeting?.id ?? "",
      meetingTitle: meeting?.title ?? "",
      meetingSubId: meeting?.meetingSubId ?? "",
      meetingNumber: meeting?.meetingNumber ?? "",
      repeatType: meeting?.repeatType ?? MeetingRepeatType.None,
      appointmentType: meeting?.appointmentType ?? MeetingAppointmentType.Quick,
    } as IMeetingInfoProps);

    this.service.roomAction.updateSecureInfo({
      isWaitingRoomEnabled: meeting.isWaitingRoomEnabled ?? false,
      isLockEnabled: meeting.isLocked ?? false,
    });

    this.service.roomAction.updateMeetingSettingInfo({
      isMute: meeting?.isMuted ? true : false,
      isMetis: meeting?.isMetis ? true : false,
      isSetPassword: meeting?.isPasswordEnabled ? true : false,
      isRecorded: meeting?.isRecorded ? true : false,
    } as IMeetingSettingInfoProps);

    if (meeting?.isActiveRecord) {
      this.service.roomStore.updateRecordInfo({
        taskId: taskId ?? "",
        meetingRecordId: meeting?.meetingRecordId,
        isRecording: true,
      } as IRecordingInfoProps);
    }
  }

  updateSecureInfo(info: Partial<ISecurityProps>) {
    this.service.roomStore.updateSecurityInfo({
      ...this.service.roomStore.securityInfo,
      ...info,
    });
  }

  updateMeetingSettingInfo(info: Partial<IMeetingSettingInfoProps>) {
    this.service.roomStore.updateMeetingSettingInfo(info);
  }

  publishData<T>(
    data: DataChannelMessage<T>,
    destination?: RemoteParticipant[] | string[],
  ) {
    const msg = JSON.stringify({
      ...data,
      destination: destination,
    });

    this.sendTextMessage(msg);
  }

  // https://web.sdk.qcloud.com/im/doc/v3/zh-cn/SDK.html#sendMessage
  sendTextMessage(msg: string) {
    const _this = this;

    const chat = this.service?.chat;

    const roomNumber = this.service.roomStore?.meeting?.meetingNumber;

    const LoginUser = chat.getLoginUser();

    if (!chat || !roomNumber || !chat.isReady()) {
      return;
    }

    let message = chat.createTextMessage({
      to: roomNumber + "",
      conversationType: TencentCloudChat.TYPES.CONV_GROUP,
      // 消息优先级，用于群聊。如果某个群的消息超过了频率限制，后台会优先下发高优先级的消息，详细请参考：https://cloud.tencent.com/document/product/269/3663#.E6.B6.88.E6.81.AF.E4.BC.98.E5.85.88.E7.BA.A7.E4.B8.8E.E9.A2.91.E7.8E.87.E6.8E.A7.E5.88.B6)
      // 支持的枚举值：TencentCloudChat.TYPES.MSG_PRIORITY_HIGH, TencentCloudChat.TYPES.MSG_PRIORITY_NORMAL（默认）, TencentCloudChat.TYPES.MSG_PRIORITY_LOW, TencentCloudChat.TYPES.MSG_PRIORITY_LOWEST
      // priority: TencentCloudChat.TYPES.MSG_PRIORITY_NORMAL,

      // https://web.sdk.qcloud.com/im/doc/v3/zh-cn/SDK.html#sendMessage 不同消息类型可以通过这个查看
      payload: {
        text: msg,
      },
      // 消息自定义数据（云端保存，会发送到对端，程序卸载重装后还能拉取到）
      // cloudCustomData: 'your cloud custom data'
      // receiverList: destination,
    });

    let promise = chat.sendMessage(message);

    promise
      .then(function (imResponse) {
        // 发送成功
        console.log("发送成功", msg, imResponse);

        _this.service.emit(RoomEventEnum.MESSAGE_SENT_SUCCESSFULLY, msg);
      })
      .catch(function (imError) {
        // 发送失败
        console.warn("sendMessage error:", msg, imError);

        // 重发消息
        let promise = chat.resendMessage(message); // 传入需要重发的消息实例
        promise
          .then(function (imResponse) {
            // 重发成功
            console.log("重发成功", imResponse);
          })
          .catch(function (imError) {
            // 重发失败
            console.warn("resendMessage error:", imError);

            _this.service.emit(RoomEventEnum.MESSAGE_SENT_ERROR, "");
          });
      });
  }

  //   https://web.sdk.qcloud.com/trtc/electron/doc/zh-cn/trtc_electron_sdk/TRTCCloud.html#sendCustomCmdMsg
  sendCustomCmdMsg(msg: string) {
    this.service.TRTCCloud.sendCustomCmdMsg(1, msg, true, true);
  }

  //   https://web.sdk.qcloud.com/trtc/electron/doc/zh-cn/trtc_electron_sdk/TRTCCloud.html#sendSEIMsg
  sendSEIMsg(msg: string) {
    this.service.TRTCCloud.sendSEIMsg(msg, 1);
  }

  // https://cloud.tencent.com/document/product/1137/60737
  tEduBoardEventTebSyncData(
    data: WhiteboardDataType,
    callback?: (data?: WhiteboardDataType) => void,
  ) {
    const chat = this.service.chat;

    const meeting = this.service.roomStore.meeting;

    let message = chat.createCustomMessage({
      to: meeting.meetingNumber,
      conversationType: TencentCloudChat.TYPES.CONV_GROUP,
      priority: TencentCloudChat.TYPES.MSG_PRIORITY_HIGH, // 因为im消息有限频，白板消息的优先级调整为最高
      payload: {
        data: JSON.stringify(data),
        description: "",
        extension: "TXWhiteBoardExt", // 固定写法，各端会以extension: 'TXWhiteBoardExt'为标志作为白板信令
      },
    });

    chat.sendMessage(message).then(
      () => {
        // 同步成功
        console.log("发送成功", data);

        this.service.emit(RoomEventEnum.TEDU_BOARD_SYNC_DATA, data);

        callback && callback(data);
      },
      () => {
        console.error("发送失败");

        // 重发消息
        let promise = chat.resendMessage(message); // 传入需要重发的消息实例
        promise
          .then(function (imResponse) {
            // 重发成功
            console.log(imResponse);
          })
          .catch(function (imError) {
            // 重发失败
            console.warn("resendMessage error:", imError);

            callback && callback();
          });
      },
    );
  }
}
