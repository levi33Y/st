import { useMessage } from "@/hooks/useMessage";
import { useMouse } from "@/hooks/useMouse";
import MemberList from "@/screens/trtc-room/components/member-list/index.vue";
import {
  IDataEventProps,
  MemberListEventEnum,
  MemberListTabEnum,
} from "@/screens/trtc-room/components/member-list/props";
import RoomSharing from "@/screens/trtc-room/components/screen-share-menu/index.vue";
import { GetCloudRecordGet } from "@/services/apis/trtc";
import emitter, { MeetingEventEnum } from "@/utils/trtc/hook/useMitt";
import { RoomEventEnum, roomService } from "@/utils/trtc/roomService";
import { useRoomStore, UserRoleEnum } from "@/utils/trtc/store/room";
import { ArmsBehaviorEnum, armsService } from "@components/arms/ArmsService";
import DrawingBoard from "@components/drawing-board/index.vue";
import { useDebounceFn, useInterval, useTimeoutPoll } from "@vueuse/core";
import { ElLoading, ElMessage } from "element-plus";
import { LoadingInstance } from "element-plus/es/components/loading/src/loading";
import { RemoteParticipant } from "livekit-client";
import { isEmpty, isNil } from "lodash";
import { TRTCScreenCaptureSourceInfo } from "trtc-electron-sdk";
import {
  computed,
  nextTick,
  onBeforeMount,
  onMounted,
  reactive,
  ref,
  toRaw,
  watch,
  watchEffect,
} from "vue";
import { useRoute } from "vue-router";
import {
  DataChannelCommand,
  IMsgGrpTipMessageProps,
  MeetingStatus,
  MsgGrpTip,
} from "../../../../entity/enum";
import { IUserSessionProps, userBasicInfo } from "../../../../entity/response";
import { DataChannelMessage, MeetingQuery } from "../../../../entity/types";
import { StoreEventEnum, useNavigation } from "../../../../hooks/useNavigation";
import {
  endMeetingApi,
  getAllUserInfo,
  getUserSession,
  joinMeetingApi,
  outMeetingApi,
  updateMeetingLock,
  updateMeetingRole,
  updateMeetingType,
} from "../../../../services";
import {
  GetAllInfoResponse,
  IMeetingUserSessionsProps,
  INoJoinMeetingUsersProps,
  IWaitingRoomUserSessionsProps,
  JoinMeetingResponse,
  MeetingPermissionEnum,
  OnlineTypeEnum,
} from "../../../../services/apis/meeting/types";
import { useAppStore } from "../../../../stores/useAppStore";
import { scheduleListStore } from "../../../../stores/useScheduleStore";
import { useSettingsStore } from "../../../../stores/useSettingsStore";
import { messageBox } from "../../../../utils/message-box";
import LeaveMeeting from "../leave-meeting/index.vue";
import RecordingBtn from "../recording-btn/index.vue";
import RoomTab from "../room-tab/index.vue";
import { IRoomTabItemProps, TabsEnum } from "../room-tab/props";

const roomPage = "/trtc-room";
const canvasPage = "/trtc-screen-canvas";
const screenPage = "/trtc-screen-dialog";
const memberPage = "/trtc-room-member";

export const useAction = () => {
  const appStore = useAppStore();
  const settingsStore = useSettingsStore();
  const scheduleStore = scheduleListStore();
  const { query } = useRoute();
  const navigation = useNavigation();
  const { messageServices } = useMessage();
  const roomStore = useRoomStore();
  const { counter, reset: resetCounter } = useInterval(1000, {
    controls: true,
  });
  const { stoped, focused } = useMouse();

  const meetingQuery = reactive<MeetingQuery>({
    autoAudio: query.autoAudio === "true",
    isMuted: query.isMuted === "true",
    enableCamera: query.enableCamera === "true",
    meetingNumber: query.meetingNumber as string,
    userName: query.userName as string,
    meetingStreamMode: +(query.meetingStreamMode as any),
    securityCode: query.joinPassword as string,
  });
  const state = reactive<{
    shareStream?: MediaStream;
    shareAudioStream?: MediaStream;
    isScreenShareEnabled: boolean;
    participateDuration?: string;
    roomTabValue: TabsEnum | null;
    isPopConnectErrorMessage?: boolean;
    isSelfEndingMeeting: boolean;
  }>({
    shareStream: undefined,
    isScreenShareEnabled: false,
    participateDuration: "123213",
    roomTabValue: null,
    isSelfEndingMeeting: false,
  });
  const waitingReminder = reactive<{
    size: number;
    dialogVisible: boolean;
    isIgnore: boolean;
  }>({
    size: 0,
    dialogVisible: false,
    isIgnore: false,
  });

  const moderator = ref<userBasicInfo>({} as userBasicInfo);
  const meetingInfo = ref<JoinMeetingResponse>({} as JoinMeetingResponse);
  const userSessionResponse = ref<IUserSessionProps>({} as IUserSessionProps);
  const joinMeetingResponse = ref<JoinMeetingResponse | undefined>();
  const meetingUserSessions = ref<IMeetingUserSessionsProps[]>([]);
  const waitingRoomUserSessions = ref<IWaitingRoomUserSessionsProps[]>([]);
  const noJoinMeetingUsers = ref<INoJoinMeetingUsersProps[]>([]);
  const meetingPermissionMap = ref<Map<string, MeetingPermissionEnum | null>>(
    new Map(),
  );

  // 组件 Ref
  const leaveMeetingRef = ref<InstanceType<typeof LeaveMeeting>>();
  const drawingBoardRef = ref<InstanceType<typeof DrawingBoard>>();
  const roomContainerRef = ref<HTMLDivElement>();
  const roomTabRef = ref<InstanceType<typeof RoomTab>>();
  const roomSharingRef = ref<InstanceType<typeof RoomSharing>>();
  const loadingService = ref<LoadingInstance | null>(null);
  const memberListRef = ref<InstanceType<typeof MemberList>>();
  const recordingBtnRef = ref<InstanceType<typeof RecordingBtn>>();

  // 计算属性
  const isWaitingRoomEnabled = computed(
    () => roomService.roomStore.isWaitingRoomEnabled,
  );
  const meeting = computed(() => roomService.roomStore?.meeting);
  const localUser = computed(() => roomService?.roomStore?.localUser);
  const streamList = computed(() => roomService?.roomStore?.userList ?? []);
  const recordingState = computed(
    () => roomService.roomStore?.recordState ?? {},
  );
  const userSate = computed(() => localUser.value?.status);
  const isCameraEnable = computed(
    () => roomService.roomStore?.isCameraEnable ?? false,
  );
  const isMuted = computed(() => roomService.roomStore?.isMuted ?? true);
  const isModerator = computed(
    () => roomService.roomStore?.isModerator ?? false,
  );
  const isCreator = computed(() => roomService.roomStore?.isCreator ?? false);
  const isSharingScreen = computed(() => {
    return !isNil(roomService.roomStore?.localUser?.screenShareStream);
  });
  const isHasShareScreen = computed(() => {
    return !isNil(roomService.roomStore.shareScreenUser);
  });

  const publishData = <T>(
    data: DataChannelMessage<T>,
    destination?: RemoteParticipant[] | string[],
  ) => {
    roomService.roomAction.publishData(data, destination);
  };

  const blockClose = async () => {
    stopShare(() => {
      if (
        ![OnlineTypeEnum.Online, OnlineTypeEnum.Waiting].includes(
          userSate.value as OnlineTypeEnum,
        )
      ) {
        navigation.destroy(roomPage);
      }

      if (leaveMeetingRef?.value?.open) {
        leaveMeetingRef.value?.open();
      } else {
        leaveMeeting();
      }
    });
  };

  const loadMeetingContext = async (): Promise<JoinMeetingResponse> => {
    if (!isNil(joinMeetingResponse.value)) {
      return toRaw(joinMeetingResponse.value);
    }

    const { code: joinCode, data: joinData } = await joinMeetingApi({
      meetingNumber: meetingQuery.meetingNumber,
      isMuted: meetingQuery.isMuted,
      securityCode: meetingQuery.securityCode,
    });

    if (joinCode !== 200 || !joinData?.meeting?.id) {
      throw new Error("joinMeetingApi error");
    }

    const { code: userCode, data: userData } = await getUserSession(
      joinData.meeting.meetingMasterUserId,
    );

    if (userCode !== 200) {
      throw new Error("getUserSession error");
    }

    moderator.value = userData;

    meetingInfo.value = joinData;

    joinMeetingResponse.value = joinData;

    userSessionResponse.value = joinData?.meeting?.userSessions?.find(
      (item) => item.userId + "" === appStore.userInfo?.id + "",
    ) as IUserSessionProps;

    return joinData ?? {};
  };

  const leaveMeeting = async () => {
    loadingService.value = ElLoading.service({ fullscreen: true });

    try {
      const isLast =
        roomService.roomStore.userList?.filter(
          (item) =>
            item.name !== "Anonymity" && item.status == OnlineTypeEnum.Online,
        ).length <= 1;

      if (isLast && recordingState.value.isRecording) {
        await recordingBtnRef.value?.stopRecord();
      }

      await outMeetingApi({
        meetingId: meeting.value?.meetingId,
        meetingSubId: roomService.roomStore.isRepeatedMeeting
          ? undefined
          : meeting.value.meetingSubId,
      });

      roomService.roomAction.out();

      roomService.roomAction.quitGroup().finally(() => {
        publishData<IMsgGrpTipMessageProps>({
          command: DataChannelCommand.MSG_GRP_TIP,
          message: {
            type: MsgGrpTip.GRP_TIP_MBR_QUIT,
            sid: localUser.value?.sid,
          },
        });

        roomService.roomAction.logout();
      });
    } catch (err) {
      ElMessage({
        message: (err as Error)?.message ?? err,
        type: "error",
      });
    } finally {
      loadingService.value?.close();
    }
  };

  const endMeeting = async () => {
    loadingService.value = ElLoading.service({ fullscreen: true });

    state.isSelfEndingMeeting = true;

    // The members of the waiting room are not in the room
    publishData({
      command: DataChannelCommand.MemberManagement,
      message: {
        type: MemberListEventEnum.Remove,
      },
    });

    try {
      await recordingBtnRef.value?.stopRecord();

      await endMeetingApi({
        meetingNumber: meetingQuery?.meetingNumber,
      });
    } catch (err) {
      ElMessage({
        message: (err as Error)?.message ?? err,
        type: "error",
      });

      state.isSelfEndingMeeting = false;
    } finally {
      loadingService.value?.close();
    }
  };

  const { pause: pauseConnect, resume: resumeConnect } = useTimeoutPoll(
    async () => {
      try {
        const res = await loadMeetingContext();

        const userSession = res?.meeting?.userSessions?.find(
          (item) => item.userId + "" === appStore.userInfo?.id + "",
        ) as IUserSessionProps;

        const user = await roomService.roomAction.login({
          userId: appStore.userInfo.id + "",
          userName: appStore.userInfo.userName,
        });

        if (!user?.userSig || !user?.userSid || !userSession) {
          throw "error";
        }

        roomService.roomAction.initMeetingInfo(res);

        roomService.mediaManager.setVideoResolution(res.recordingResolution);

        roomService
          .on(RoomEventEnum.PERMISSION_UPDATED, () => {
            updateMeetingPermissions();
          })
          .on(RoomEventEnum.ON_ENTER_ROOM, () => {
            const userSession = meetingInfo.value?.meeting?.userSessions?.find(
              (item) => item.userId + "" === appStore.userInfo?.id + "",
            ) as IUserSessionProps;

            if (meetingInfo.value?.meeting?.isActiveRecord && !isMuted.value) {
              recordingBtnRef.value?.recordSpeak();
            } else if (
              (meetingInfo.value?.meeting?.isMetis ||
                meetingInfo.value?.meeting?.isRecorded) &&
              userSession.isMeetingMaster &&
              !meetingInfo.value?.meeting?.isActiveRecord
            ) {
              recordingBtnRef.value?.startRecord();
            }
          })
          .on(RoomEventEnum.KICKED_OUT, async () => {
            stopShare(() => {
              leaveMeeting();
            });
          })
          .on(RoomEventEnum.SECURE_UPDATE, () => {
            updateMeetingLock({
              meetingId: meeting.value.meetingId,
            }).then((res) => {
              roomService.roomAction.updateSecureInfo({
                isLockEnabled: res?.data?.isLocked ?? false,
                isWaitingRoomEnabled: res?.data?.isOpenWaitingRoom ?? false,
              });
            });
          })
          .on(RoomEventEnum.RECORD_UPDATE, () => {
            recordingBtnRef?.value?.updateRecord();
          })
          .on(RoomEventEnum.LOGOUT, async () => {
            armsService.addBehavior(ArmsBehaviorEnum.ROOM, "已离开房间");

            loadingService.value = ElLoading.service({ fullscreen: true });

            setTimeout(() => {
              loadingService.value?.close();

              navigation.destroy(roomPage);
            }, 1000);
          });

        const useReq: any = {
          roomId: Number(meetingQuery.meetingNumber),
          userId: appStore.userInfo.id + "",
          userName: appStore.userName,
        };

        if (
          userSession.isMeetingMaster ||
          appStore.userInfo?.id == res?.meeting?.createdBy
        ) {
          useReq.role = UserRoleEnum.Host;
        }

        if (res.meeting.isWaitingRoomEnabled && isNil(useReq?.role)) {
          if (userSession.allowEntryMeeting) {
            roomService.roomAction.enter(useReq);

            updateMeetingPermissions();
          } else {
            roomService.userManager.updateUser(user.userSid, {
              status: OnlineTypeEnum.Waiting,
            });
          }
        } else {
          roomService.roomAction.enter(useReq);

          updateMeetingPermissions();
        }

        pauseConnect();

        joinMeetingResponse.value = undefined;
      } catch (error) {
        console.warn((error as Error)?.message ?? error);

        if (counter.value > 120) {
          pauseConnect();

          messageBox(
            {
              message: "網絡異常，請檢查網絡設置，或嘗試重新入會。",
              showCancelButton: true,
              confirmButtonText: "重新入會",
              cancelButtonText: "離開會議",
            },
            (flag) => {
              if (flag === "confirm") {
                resetCounter();

                resumeConnect();
              } else {
                navigation.destroy(roomPage);
              }
            },
          );
        }
      }

      if (!isPendingPollUpdateMeetingPermissions.value) {
        resumePollUpdateMeetingPermissions();
      }
    },
    10000,
    {
      immediate: false,
      immediateCallback: true,
    },
  );

  const startShare = (source: TRTCScreenCaptureSourceInfo) => {
    try {
      roomService.mediaManager.setScreenShareEnabled(
        {
          enabled: true,
          device: {
            sourceId: source.sourceId,
          },
        },
        (mediaStream) => {
          if (mediaStream) {
            navigation.navigate(canvasPage, {
              ...source,
              userSid: roomService.roomStore?.localUser?.sid,
              meetingNumber: roomService.roomStore?.meeting?.meetingNumber,
              ...roomService.basicStore.sdk,
            });
          }
        },
      );
    } catch (e) {
      ElMessage.error("共享失敗 " + (e as Error)?.message);

      stopShare();
    }
  };

  const stopShare = async (callback?: () => void) => {
    if (!isSharingScreen.value) {
      callback?.();

      return;
    }

    const paths: string[] = [
      canvasPage,
      screenPage,
      memberPage,
      "/security-dropdown-menu",
      "/function-dropdown-menu",
      "/invite-dropdown-menu",
      "/meeting-invitation-confirm",
    ];

    paths.forEach((path) => {
      navigation.destroy(path);
    });

    roomService.mediaManager.setScreenShareEnabled(
      {
        enabled: false,
      },
      callback ? () => callback?.() : undefined,
    );
  };

  /**
   * 更新会议成员权限信息
   * 会议成员角色信息
   * 等候室成员信息
   * 未入会成员信息
   */
  const updateMeetingPermissions = useDebounceFn(async () => {
    try {
      const meeting = roomService.roomStore?.meeting;

      if (!meeting?.meetingId) {
        return;
      }

      const allApiQuery = {
        meetingId: meeting.meetingId,
      } as {
        meetingId: string;
        meetingSubId?: string;
      };

      if (meeting?.meetingSubId) {
        allApiQuery.meetingSubId = meeting.meetingSubId;
      }

      const { code, msg, data: rawData } = await getAllUserInfo(allApiQuery);

      if (code !== 200 || rawData.meetingUserSessions?.length < 0) {
        throw Error(msg);
      }

      // Anonymity Username: 9D86F6F3-773D-4629-93CF-2EAF3ABE13EA
      const data: GetAllInfoResponse = {
        ...rawData,
        waitingRoomUserSessions: rawData.waitingRoomUserSessions.filter(
          (item) => {
            return (item.userName + "").length !== 36;
          },
        ),
      };

      waitingRoomNotification(
        toRaw(waitingRoomUserSessions.value),
        data.waitingRoomUserSessions,
      );

      meetingUserSessions.value = data?.meetingUserSessions ?? [];

      noJoinMeetingUsers.value = data?.noJoinMeetingUsers ?? [];

      waitingRoomUserSessions.value = data?.waitingRoomUserSessions ?? [];

      const userSession = data?.meetingUserSessions?.find(
        (item) => item.userId + "" == localUser.value?.id + "",
      );

      if (userSession) {
        userSessionResponse.value = userSession;
      }

      roomService.userManager.updateUserPermission(data);
    } catch {}
  }, 2000);

  /**
   * 等候室通知
   * @param oldRoom
   * @param newRoom
   * @returns
   */
  const waitingRoomNotification = (
    oldRoom: any[] = [],
    newRoom: any[] = [],
  ) => {
    if (!roomService.roomStore.isHasHost) {
      return;
    }

    const oldWaitUserIds = new Set(oldRoom.map((u) => u.userId));

    const newEntries = newRoom.filter((u) => !oldWaitUserIds.has(u.userId));

    if (newEntries.length > 0) {
      if (!waitingReminder.isIgnore) {
        waitingReminder.size = newEntries.length;

        waitingReminder.dialogVisible = true;
      }
    }
  };

  /**
   * 轮询更新会议成员权限信息
   * @param params
   * @returns
   */
  const {
    pause: pausePollUpdateMeetingPermissions,
    resume: resumePollUpdateMeetingPermissions,
    isActive: isPendingPollUpdateMeetingPermissions,
  } = useTimeoutPoll(
    async () => {
      try {
        await updateMeetingPermissions();
      } catch (err) {
        console.error(err);
      }
    },
    3000,
    {
      immediateCallback: true,
    },
  );

  const handleMemberListDataReceived = async (params: IDataEventProps) => {
    console.log("----handleMemberListDataReceived----", params);

    try {
      const data = params.data;

      const targetParticipant = roomService.roomStore.getUserInfoById(
        data?.userId,
      );

      const {
        sid: sid = "",
        id: participantId = "",
        name: username,
        isLocal,
      } = targetParticipant ?? {};

      const apiId =
        meetingUserSessions.value?.find(
          (item) => item.userId + "" === participantId + "",
        )?.id ||
        waitingRoomUserSessions.value?.find(
          (item) => item.userId + "" === participantId + "",
        )?.id;

      switch (params.type) {
        case MemberListEventEnum.ChangeName:
          if (isLocal) {
            roomService.userManager.updateNickName(data.name);
          } else {
            publishData(
              {
                command: DataChannelCommand.MemberManagement,
                message: {
                  type: MemberListEventEnum.ChangeName,
                  value: data.name,
                },
              },
              [sid],
            );
          }

          break;
        case MemberListEventEnum.Mute:
          if (isLocal) {
            roomService.mediaManager.setMicrophoneEnabled(!data.isMuted);
          } else {
            publishData(
              {
                command: DataChannelCommand.MemberManagement,
                message: {
                  type: MemberListEventEnum.Mute,
                  value: data?.isMuted,
                },
              },
              [sid],
            );
          }

          break;
        case MemberListEventEnum.AllMute:
          publishData({
            command: DataChannelCommand.MemberManagement,
            message: {
              type: MemberListEventEnum.AllMute,
              value: data,
            },
          });

          roomService.mediaManager.setMicrophoneEnabled(!data);

          break;
        case MemberListEventEnum.Role:
          await updateMeetingRole({
            meetingId: meeting.value.meetingId,
            userId: data.userId,
            newRole: data.permission,
            isCoHost:
              data.permission === MeetingPermissionEnum.Host
                ? null
                : data.isCoHost,
          })
            .then(async () => {
              publishData({
                command: DataChannelCommand.MemberManagement,
                message: {
                  type: MemberListEventEnum.Role,
                },
              });

              updateMeetingPermissions();
            })
            .catch(() => {
              ElMessage.error("操作失敗");
            });

          break;
        case MemberListEventEnum.Remove:
          publishData(
            {
              command: DataChannelCommand.MemberManagement,
              message: {
                type: MemberListEventEnum.Remove,
              },
            },
            [sid],
          );

          break;
        case MemberListEventEnum.MoveToWait:
          if (!apiId) {
            ElMessage.error("用户不存在");

            return;
          }

          roomService.userManager.updateUser(sid, {
            status: OnlineTypeEnum.Waiting,
          });

          await updateMeetingType({
            ids: [parseInt(apiId + "")],
            onlineType: OnlineTypeEnum.Waiting,
          }).then(() => {
            roomService.userManager.updateUser(participantId, {
              status: OnlineTypeEnum.Waiting,
            });

            publishData(
              {
                command: DataChannelCommand.MemberManagement,
                message: {
                  type: MemberListEventEnum.MoveToWait,
                  data: participantId,
                },
              },
              [sid],
            );
          });

          break;
        case MemberListEventEnum.AutoAccess:
          {
            if (!apiId) {
              ElMessage.error("用户不存在");

              return;
            }

            await updateMeetingType({
              ids: [parseInt(apiId + "")],
              allowEntryMeeting: true,
            }).then(() => {
              roomService.userManager.updateUser(sid, {
                status: OnlineTypeEnum.Online,
              });

              publishData(
                {
                  command: DataChannelCommand.MemberManagement,
                  message: {
                    type: MemberListEventEnum.AutoAccess,
                    data: participantId,
                  },
                },
                [sid],
              );
            });
          }
          break;
        case MemberListEventEnum.RemoveWait:
          publishData(
            {
              command: DataChannelCommand.MemberManagement,
              message: {
                type: MemberListEventEnum.Remove,
                data: participantId,
              },
            },
            [sid],
          );

          break;
        case MemberListEventEnum.Access: {
          if (!apiId) {
            ElMessage.error("用户不存在");

            return;
          }

          await updateMeetingType({
            ids: [parseInt(apiId + "")],
            onlineType: OnlineTypeEnum.Online,
            allowEntryMeeting: false,
          }).then(() => {
            roomService.userManager.updateUser(sid, {
              status: OnlineTypeEnum.Online,
            });

            publishData(
              {
                command: DataChannelCommand.MemberManagement,
                message: {
                  type: MemberListEventEnum.Access,
                  data: participantId,
                },
              },
              [sid],
            );
          });

          break;
        }
        case MemberListEventEnum.AllAccess:
          const ids = toRaw(waitingRoomUserSessions.value)?.map((item) =>
            parseInt(item.id + ""),
          );

          await updateMeetingType({
            ids,
            onlineType: OnlineTypeEnum.Online,
          }).then(() => {
            publishData({
              command: DataChannelCommand.MemberManagement,
              message: {
                type: MemberListEventEnum.AllAccess,
              },
            });
          });

          break;
        case MemberListEventEnum.AllRemove:
          const kickIds = streamList.value
            .filter((item) =>
              waitingRoomUserSessions.value.some(
                (waitItem) => waitItem.userId + "" === item.id + "",
              ),
            )
            .map((item) => item.sid);

          publishData(
            {
              command: DataChannelCommand.MemberManagement,
              message: {
                type: MemberListEventEnum.Remove,
              },
            },
            [...kickIds],
          );

          break;

        case MemberListEventEnum.Call: {
        }
        default:
          break;
      }
    } catch (err) {
      console.error(err);
    } finally {
      updateMeetingPermissions();
    }
  };

  const jumpManagementList = async (val: MemberListTabEnum) => {
    !state.roomTabValue &&
      (await onShowSidebar({
        name: TabsEnum.MemberList,
        title: `${TabsEnum.MemberList}(${streamList.value.length ?? 0})`,
      }));

    nextTick(() => {
      memberListRef.value?.switchTab(val);
    });
  };

  const onShowSidebar = async (data: IRoomTabItemProps) => {
    roomContainerRef.value?.style &&
      (roomContainerRef.value!.style.flex = `0 0 ${
        roomContainerRef?.value!.offsetWidth
      }px`);

    await roomTabRef?.value?.onOpenTab(data);

    roomContainerRef.value!.style.flex = `1`;
  };

  watch(
    () => isMuted.value,
    (val) => {
      if (roomService.roomStore.isRecording) {
        recordingBtnRef.value?.recordSpeak();
      }
    },
  );

  watchEffect(() => {
    let _format = (num: number) => (num < 10 ? `0${num}` : `${num}`);

    let hour = Math.floor((counter.value / 3600) % 24);

    let minute = Math.floor((counter.value / 60) % 60);

    let second = Math.floor(counter.value % 60);

    state.participateDuration = `${_format(hour)}:${_format(minute)}:${_format(
      second,
    )}`;
  });

  onBeforeMount(() => {
    navigation.blockClose(roomPage, blockClose);
  });

  onMounted(() => {
    appStore.isMeeting = true;

    if (
      isNil(meetingQuery.meetingNumber) ||
      isEmpty(meetingQuery.meetingNumber)
    ) {
      messageBox(
        {
          message: "服務異常，請關閉窗口後重新加入會議。",
          confirmButtonText: "確定",
        },
        () => {
          navigation.destroy(roomPage);
        },
      );

      return;
    }

    resumeConnect();
  });

  onMounted(() => {
    window.winEvents.onClose(() => {
      appStore.isMeeting = false;

      scheduleStore.updateItemStatus(
        meetingInfo.value?.meeting?.id,
        MeetingStatus.Completed,
      );
    });
  });

  onMounted(() => {
    navigation
      .on(StoreEventEnum.ShareScreen, async (value) => {
        if (isHasShareScreen.value) {
          ElMessage({
            message: "正在共享,无法重复共享",
            type: "warning",
          });

          stopShare();

          return;
        }

        if (!value?.sourceId) {
          return;
        }

        loadingService.value = ElLoading.service({ fullscreen: true });

        await GetCloudRecordGet()
          .then((res) => {
            roomService.mediaManager.setVideoResolution(res?.data);
          })
          .finally(() => {
            loadingService.value?.close();

            startShare(value);
          });
      })
      .on(StoreEventEnum.MemberListDataReceived, handleMemberListDataReceived)
      .on(StoreEventEnum.WhiteboardSendMessage, (value) => {
        roomService.roomAction.tEduBoardEventTebSyncData(value, (data) => {
          navigation.emit(StoreEventEnum.WhiteboardSendAddAckData, data);
        });
      })
      .on(StoreEventEnum.SwitchMeeting, async (data) => {
        await stopShare();

        messageBox(
          {
            title: "加入新會議",
            message: "確定離開當前會議，加入新會議？",
            showCancelButton: true,
            confirmButtonText: "確認",
            cancelButtonText: "取消",
          },
          async (flag) => {
            if (flag === "confirm") {
              try {
                loadingService.value = ElLoading.service({ fullscreen: true });

                stopShare(() => {
                  leaveMeeting()
                    .then(() => {
                      navigation.reNavigate(roomPage, data);
                    })
                    .catch(() => {
                      ElMessage.error("服務異常");
                    });
                });
              } finally {
                loadingService.value?.close();
              }
            }
          },
        );
      });
  });

  onMounted(() => {
    emitter.on(MeetingEventEnum.MemberManagerEvent, ({ type, data }) => {
      switch (type) {
        case "ShowSidebar": {
          onShowSidebar(data as IRoomTabItemProps);

          break;
        }
        case "JumpManagementList": {
          jumpManagementList(data as MemberListTabEnum);

          break;
        }
      }
    });
  });

  return {
    stoped,
    focused,
    leaveMeetingRef,
    drawingBoardRef,
    roomContainerRef,
    recordingBtnRef,
    roomTabRef,
    appStore,
    streamList,
    meetingQuery,
    state,
    moderator,
    recordingState,
    roomSharingRef,
    settingsStore,
    userSate,
    noJoinMeetingUsers,
    waitingRoomUserSessions,
    waitingReminder,
    memberListRef,
    roomStore,
    isModerator,
    isSharingScreen,
    meetingInfo,
    meetingPermissionMap,
    isWaitingRoomEnabled,
    isHasShareScreen,
    meetingUserSessions,
    blockClose,
    startShare,
    stopShare,
    leaveMeeting,
    endMeeting,
    onShowSidebar,
    publishData,
    handleMemberListDataReceived,
    jumpManagementList,
  };
};
