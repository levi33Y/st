import {
  DataChannelCommand,
  IMsgGrpTipMessageProps,
  MsgGrpTip,
} from "@/entity/enum";
import { OnlineTypeEnum } from "@/entity/response";
import { DataChannelMessage } from "@/entity/types";
import { MemberListEventEnum } from "@/screens/trtc-room/components/member-list/props";
import {
  GetAllInfoResponse,
  IMeetingUserSessionsProps,
} from "@/services/apis/meeting/types";
import { IRoomServiceProps, RoomEventEnum } from "@/utils/trtc/roomService";
import {
  IMeetingInfoProps,
  IUserInfoProps,
  UserRoleEnum,
} from "@/utils/trtc/store/room";
import { GroupMember } from "@tencentcloud/chat";
import { useTimeoutPoll } from "@vueuse/core";
import { isEmpty, isNil } from "lodash";
import { TRTCVideoStreamType } from "trtc-electron-sdk";

export class User implements IUserInfoProps {
  id: string;
  name: string;
  /** server assigned unique id */
  sid: string;
  nick: string;
  isMuted: boolean = true;
  outputAudioLevel: number = 0;
  screenShareStream: MediaStream | null = null;
  cameraStream: MediaStream | null = null;
  isLocal: boolean = false;
  role: UserRoleEnum = UserRoleEnum.Participant;
  status: OnlineTypeEnum = OnlineTypeEnum.OutMeeting;
  avatarUrl: string = "";

  static getIds(id: string) {
    const lastIndex = id.lastIndexOf("_");

    if (lastIndex === -1) {
      return [id, id];
    }

    const firstPart = id.substring(0, lastIndex);

    const secondPart = id.substring(lastIndex + 1);

    return [firstPart, secondPart];
  }

  static verify(sid: string) {
    return sid.split("_")?.length >= 2;
  }

  constructor(sid: string) {
    const [name, id] = User.getIds(sid);

    this.id = id;

    this.name = name;

    this.sid = sid;

    this.nick = name;
  }
}

export interface IUserManagerProps {}

export class UserManager implements IUserManagerProps {
  private service: IRoomServiceProps;

  constructor(service: IRoomServiceProps) {
    this.service = service;

    this.bindMessageEvent();
  }

  private bindMessageEvent() {
    this.service
      .on(RoomEventEnum.MSG_TEXT, (data: DataChannelMessage<any>) => {
        const command = data?.command;

        const { type = "", value = false } = data?.message ?? {};

        if (command !== DataChannelCommand.MemberManagement) {
          return;
        }

        switch (type) {
          case MemberListEventEnum.Role:
            this.service.emit(RoomEventEnum.PERMISSION_UPDATED);

            break;
          case MemberListEventEnum.AllMute: {
            this.service.mediaManager.setMicrophoneEnabled(!value);

            break;
          }
          case MemberListEventEnum.Mute:
            this.service.mediaManager.setMicrophoneEnabled(!value);

            break;
          case MemberListEventEnum.ChangeName: {
            this.service.userManager.updateNickName(value);

            break;
          }
          case MemberListEventEnum.Remove: {
            this.service.roomAction.out();

            this.service.emit(RoomEventEnum.KICKED_OUT);

            break;
          }
          case MemberListEventEnum.MoveToWait: {
            this.service.emit(RoomEventEnum.PERMISSION_UPDATED);

            break;
          }
          case MemberListEventEnum.Access: {
            this.service.emit(RoomEventEnum.PERMISSION_UPDATED);

            break;
          }
          case MemberListEventEnum.RemoveWait: {
            this.service.emit(RoomEventEnum.KICKED_OUT);
            break;
          }
          case MemberListEventEnum.AutoAccess: {
            this.service.emit(RoomEventEnum.PERMISSION_UPDATED);

            break;
          }
          case MemberListEventEnum.AllAccess: {
            this.service.emit(RoomEventEnum.PERMISSION_UPDATED);

            break;
          }
          case MemberListEventEnum.AllRemove: {
            this.service.emit(RoomEventEnum.KICKED_OUT);

            break;
          }
          default: {
            break;
          }
        }
      })
      .on(RoomEventEnum.PROFILE_UPDATED, () => {
        console.log("---PROFILE_UPDATED---");

        const service = this.service;

        if (!service.chat.isReady()) {
          return;
        }

        let offset = 0;

        const { pause } = useTimeoutPoll(
          async () => {
            const group = service.roomStore.meeting.meetingNumber;

            if (group) {
              try {
                const response = await service.chat.getGroupMemberList({
                  groupID: group,
                  offset,
                  count: 100,
                });

                const members =
                  (response.data.memberList as GroupMember[]) ?? [];

                console.log("---group---", group, members);

                members.forEach((item) => {
                  const userName = item.userID.split("_")?.at(0);

                  const user = service.roomStore.getUserInfoBySid(item.userID);

                  if (!user || user.nick != item.nick) {
                    service.userManager.updateUser(item.userID, {
                      nick: isEmpty(item?.nick) ? userName : item.nick,
                    });
                  }
                });

                if (response.data.offset === 0 && !isEmpty(members)) {
                  pause();
                }

                offset = response.data.offset;
              } catch (error) {
                console.warn("getGroupMemberList error:", error);
              }
            }
          },
          1000,
          {
            immediateCallback: true,
            immediate: true,
          },
        );
      });
  }

  insertUser(sid: string, isLocal: boolean = false) {
    if (!User.verify(sid)) {
      return;
    }

    if (isNil(this.service.roomStore.getUserInfoBySid(sid))) {
      this.service.roomStore.insertUserInfo(new User(sid), isLocal);
    }
  }

  updateUser(sid: string, info: Partial<IUserInfoProps>) {
    if (!User.verify(sid)) {
      return;
    }

    const user = this.service.roomStore.getUserInfoBySid(sid);

    let r;

    if (user) {
      r = user;
    } else {
      r = new User(sid);
    }

    this.service.roomStore.updateUserInfo({
      ...r,
      ...info,
    });

    this.service.emit(RoomEventEnum.ROOM_MEMBER_UPDATE);
  }

  async updateNickName(nickName: string): Promise<void> {
    const service = this.service;

    let promise = service.chat.updateMyProfile({
      nick: nickName,
    });
    return promise
      .then(function (imResponse) {
        console.log(service.roomStore.localUser, imResponse.data); // 更新资料成功

        service.roomAction.publishData<IMsgGrpTipMessageProps>({
          command: DataChannelCommand.MSG_GRP_TIP,
          message: {
            type: MsgGrpTip.GRP_TIP_GRP_PROFILE_UPDATED,
            sid: nickName,
          },
        });
      })
      .catch(function (imError) {
        console.warn("updateMyProfile error:", imError); // 更新资料失败的相关信息
      });
  }

  updateSpeakInfo(
    userVolumes: Array<any>,
    userVolumesCount: number,
    totalVolume: number,
  ) {
    // 包括每个 userId 的音量和远端总音量；本地用户 userid 为''。
    const userStore = this.service.roomStore;

    const userList = [...userStore.userList];

    let newSpeakersList: string[] = [];

    userList.forEach((user) => {
      let volume = 0;

      if (user.isLocal) {
        volume = userVolumes.find((item) => item.userId == "")?.volume ?? 0;
      } else {
        volume =
          userVolumes.find((item) => item.userId == user.sid)?.volume ?? 0;
      }

      this.service.userManager.updateUser(user.sid, {
        outputAudioLevel: volume,
      });
    });

    userVolumes.forEach((item) => {
      const p =
        item.userId == ""
          ? userStore.localUser
          : userStore.getUserInfoBySid(item.userId);

      if (p && !p.isMuted && item.volume > 10 && p?.name) {
        newSpeakersList.push(p.name);
      }
    });

    userStore.updateSpeakList(newSpeakersList);
  }

  updateUserPermission(data: GetAllInfoResponse) {
    const waitUsers = data?.waitingRoomUserSessions ?? [];

    const meetingUsers = data?.meetingUserSessions ?? [];

    const onJoinUsers = data?.noJoinMeetingUsers ?? [];

    const localUser = this.service.roomStore.localUser;

    let roleObj: Record<string, UserRoleEnum> = {} as Record<
      string,
      UserRoleEnum
    >;

    meetingUsers.forEach((item: IMeetingUserSessionsProps) => {
      if (item?.isMeetingCreator) {
        this.service.roomStore.updateMeetingInfo({
          creatorId: item.userId + "",
          creatorName: item.userName + "",
        } as IMeetingInfoProps);
      }

      if (item?.isMeetingMaster) {
        roleObj[item.userId + ""] = UserRoleEnum.Host;
      } else if (item?.coHost || item?.isMeetingCreator) {
        roleObj[item.userId + ""] = UserRoleEnum.CoHost;
      }
    });

    this.service.roomStore.userList.forEach((user) => {
      const userSession =
        meetingUsers.find((item) => item.userId + "" == user.id) ??
        waitUsers.find((item) => item.userId + "" == user.id);

      const willToWait = userSession?.onlineType == OnlineTypeEnum.Waiting;

      const willToMeeting = userSession?.onlineType == OnlineTypeEnum.Online;

      const roleInfo = {
        sid: user.sid,
        avatarUrl: userSession?.url ?? "",
        role: roleObj[user.id] ?? UserRoleEnum.Participant,
      } as IUserInfoProps;

      if (willToWait) {
        roleInfo.status = OnlineTypeEnum.Waiting;
      } else if (willToMeeting) {
        // 在trtc onRemoteUserEnterRoom监听设置其他用户在线状态
        // roleInfo.status = OnlineTypeEnum.Online;
      } else if (user.status != OnlineTypeEnum.OutMeeting) {
        roleInfo.status = OnlineTypeEnum.OutMeeting;
      }

      if (user.sid === localUser.sid) {
        if (willToWait) {
          if (localUser?.status == OnlineTypeEnum.Online) {
            this.service.roomAction.out();
          }
        } else if (userSession && willToMeeting) {
          if (
            userSession.allowEntryMeeting ||
            localUser?.status == OnlineTypeEnum.Waiting
          ) {
            this.service.roomAction.enter({
              roomId: Number(this.service.roomStore.meetingInfo.meetingNumber),
              userId: userSession.userId + "",
              userName: userSession.userName,
            });
          }
        }
      }

      this.service.roomStore.updateUserInfo(roleInfo);
    });

    this.service.roomStore.updateNoJoinUsers(
      onJoinUsers?.map((item) => ({
        ...item,
        id: item.id + "",
        name: item.userName,
        avatarUrl: item?.url,
      })),
    );
  }

  updateMicroPhoneAvailable(sid: string, available: 1 | 0) {
    const participant = this.service.roomStore.getUserInfoBySid(sid);

    if (!participant) return;

    if (!isNil(available)) {
      participant.isMuted = available === 0;
    }

    if (participant.status !== OnlineTypeEnum.Online) {
      participant.status = OnlineTypeEnum.Online;
    }

    this.service.roomStore.updateUserInfo(participant);
  }

  updateScreenShareAvailable(sid: string, available: 1 | 0) {
    let screenShareStream = null;

    const TRTCCloud = this.service.TRTCCloud;

    if (available === 1) {
      const view = document.createElement("div");

      TRTCCloud.startRemoteView(
        sid,
        view,
        TRTCVideoStreamType.TRTCVideoStreamTypeSub,
      );

      const videoElement = view?.querySelector("video");

      if (videoElement && videoElement.srcObject) {
        screenShareStream = videoElement.srcObject as MediaStream;
      }
    } else if (available === 0) {
      TRTCCloud.stopRemoteView(sid);

      screenShareStream = null;
    }

    const query = {
      screenShareStream,
    };

    const participant = this.service.roomStore.getUserInfoBySid(sid);

    if (participant?.status !== OnlineTypeEnum.Online) {
      participant.status = OnlineTypeEnum.Online;
    }

    this.service.userManager.updateUser(sid, query);
  }

  updateCameraAvailable(sid: string, available: 1 | 0) {
    const participant = this.service.roomStore.getUserInfoBySid(sid);

    if (!participant) return;

    const TRTCCloud = this.service.TRTCCloud;

    if (available === 1) {
      const view = document.createElement("div");

      TRTCCloud.startRemoteView(
        sid,
        view,
        TRTCVideoStreamType.TRTCVideoStreamTypeBig,
      );

      const videoElement = view?.querySelector("video");

      if (videoElement && videoElement.srcObject) {
        participant.cameraStream = videoElement.srcObject as MediaStream;
      }
    } else if (available === 0) {
      TRTCCloud.stopRemoteView(sid);
      participant.cameraStream = null;
    }

    if (participant.status !== OnlineTypeEnum.Online) {
      participant.status = OnlineTypeEnum.Online;
    }

    this.service.roomStore.updateUserInfo(participant);
  }
}
