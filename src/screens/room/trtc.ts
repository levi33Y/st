import { useMessage } from "@/hooks/useMessage";
import RoomSharing from "@/screens/room/components/screen-share-menu/index.vue";
import genTestUserSig from "@/screens/room/config/gen-test-user-sig";
import { SecurityMenuSubscribeEnum } from "@/screens/room/props";
import { GetTencentKey } from "@/services/apis/home";
import {
  CloudRecordCreate,
  CloudRecordStop,
  CloudRecordUpdate,
} from "@/services/apis/trtc";
import {
  ScreenRecordingResolution,
  ScreenRecordingResolutionConst,
} from "@/services/apis/trtc/types";
import { useTrtcKeyStore } from "@/stores/useTrtc";
import InteractiveWhiteboard from "@components/interactive-whiteboard/index.vue";
import {
  IDataEventProps,
  MemberListEventEnum,
} from "@components/member-list/props";
import TencentCloudChat, { ChatSDK } from "@tencentcloud/chat";
import {
  useDebounceFn,
  useInterval,
  useThrottleFn,
  useTimeoutPoll,
  useWindowFocus,
} from "@vueuse/core";
import { ElLoading, ElMessage } from "element-plus";
import { LoadingInstance } from "element-plus/es/components/loading/src/loading";
import { Participant, RemoteParticipant, Room, Track } from "livekit-client";
import { isEmpty, isNil } from "lodash";
import TIMUploadPlugin from "tim-upload-plugin";
import TRTCCloud, {
  Rect,
  TRTCAppScene,
  TRTCAudioQuality,
  TRTCParams,
  TRTCScreenCaptureProperty,
  TRTCScreenCaptureSourceInfo,
  TRTCVideoEncParam,
  TRTCVideoStreamType,
} from "trtc-electron-sdk";
import {
  computed,
  nextTick,
  onBeforeMount,
  onMounted,
  onUnmounted,
  reactive,
  Ref,
  ref,
  ShallowRef,
  shallowRef,
  toRaw,
  watch,
  watchEffect,
} from "vue";
import { useRoute } from "vue-router";
import {
  DataChannelCommand,
  DataChannelNotifyType,
  EchoAvatarType,
  MeetingAppointmentType,
  MeetingRepeatType,
  MeetingStatus,
  MsgGrpTip,
  SpeechTargetLanguageType,
  StoreEventEnum,
} from "../../entity/enum";
import { Meeting, userBasicInfo } from "../../entity/response";
import {
  DataChannelMessage,
  DataChannelNotify,
  DrawingRecord,
  MeetingQuery,
  RecordSpeak,
  ScreenSource,
} from "../../entity/types";
import { useNavigation } from "../../hooks/useNavigation";
import {
  endMeetingApi,
  getAllUserInfo,
  getMeetingInfoApi,
  getUserSession,
  joinMeetingApi,
  outMeetingApi,
  recordSpeakApi,
  updateMeetingLock,
  updateMeetingRole,
} from "../../services";
import {
  MeetingPermissionEnum,
  MeetingUserSessionProps,
} from "../../services/apis/meeting/types";
import { useAppStore } from "../../stores/useAppStore";
import { useMeetingStore } from "../../stores/useMeetingStore";
import { scheduleListStore } from "../../stores/useScheduleStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { ParticipantStream } from "../../utils/livekit/ParticipantStream";
import manageDevices from "../../utils/manage-devices";
import { getMediaDeviceAccessAndStatus } from "../../utils/media";
import { messageBox } from "../../utils/message-box";
import EchoAvatarBtn from "./components/echo-avatar-btn/index.vue";
import EchoAvatar from "./components/echo-avatar/index.vue";
import LeaveMeeting from "./components/leave-meeting/index.vue";
import RoomTab from "./components/room-tab/index.vue";
import { IRoomTabItemProps, TabsEnum } from "./components/room-tab/props";

export const useAction = (emits: { (event: "reloadToggle"): void }) => {
  const appStore = useAppStore();

  const settingsStore = useSettingsStore();

  const scheduleStore = scheduleListStore();

  const meetingStore = useMeetingStore();

  const { query } = useRoute();

  const navigation = useNavigation();

  const { messageServices } = useMessage();

  const meetingQuery = reactive<MeetingQuery>({
    autoAudio: query.autoAudio === "true", // 本地是否自动连接音频
    isMuted: query.isMuted === "true", // 本地是否静音
    enableCamera: query.enableCamera === "true", // 本地是否开启摄像头
    meetingNumber: query.meetingNumber as string,
    userName: query.userName as string,
    meetingStreamMode: +(query.meetingStreamMode as any),
    securityCode: query.joinPassword as string,
  });

  const meetingId = ref("");

  const repeatType = ref();

  const appointmentType = ref();

  const meetingSubId = ref("");

  const meetingTitle = ref("");

  const room = shallowRef() as ShallowRef<Room>;

  const streamList: Ref<ParticipantStream[]> = ref([]);

  const state = reactive<{
    shareStream?: MediaStream;
    shareAudioStream?: MediaStream;
    isScreenShareEnabled: boolean; // 本地是否共享屏幕
    participateDuration?: string;
    roomTabValue: TabsEnum | null;
    isPopConnectErrorMessage?: boolean;
  }>({
    shareStream: undefined,
    isScreenShareEnabled: false,
    participateDuration: "123213",
    roomTabValue: null,
  });

  const recordingState = reactive<{
    isRecording: boolean; // 是否正在录制
    meetingRecordId: string; //会议录制Id
    egressId: string; //用于结束录制传入
  }>({
    isRecording: false,
    meetingRecordId: "",
    egressId: "",
  });

  const speakRecordState = ref<RecordSpeak>({
    id: undefined,
    meetingNumber: query.meetingNumber as string,
    meetingRecordId: "",
    trackId: "",
    speakStartTime: undefined,
    speakEndTime: undefined,
  });

  const meetingPermissionMap = ref<Map<string, MeetingPermissionEnum | null>>(
    new Map(),
  );

  const leaveMeetingRef = ref<InstanceType<typeof LeaveMeeting>>();

  const drawingBoardRef = ref<InstanceType<typeof InteractiveWhiteboard>>();

  const echoAvatarRef = ref<InstanceType<typeof EchoAvatar>>();

  const roomContainerRef = ref<HTMLDivElement>();

  const moderator = ref<userBasicInfo>({} as userBasicInfo);

  const meetingInfo = ref<Meeting>({} as Meeting);

  const creatorId = ref<string>("");

  const shareParticipant = ref<Participant | undefined>();

  const localStream = computed(() => {
    return streamList.value.find((stream) => stream.isLocal);
  });

  const speakersList = ref<string[]>([]);

  const targetLanguageType = ref<SpeechTargetLanguageType>();

  const roomTabRef = ref<InstanceType<typeof RoomTab>>();

  const roomSharingRef = ref<InstanceType<typeof RoomSharing>>();

  const echoAvatarBtnRef = ref<InstanceType<typeof EchoAvatarBtn>>();

  const loadingService = ref<LoadingInstance | null>(null);

  const isWhiteboardReady = ref(false);

  const videoResolution = ref<ScreenRecordingResolution>(
    ScreenRecordingResolution.Medium,
  );

  const isRecordDisable = computed(() => {
    return isNil(meetingPermissionMap.value?.get(appStore.userInfo.id + ""));
  });

  const isModerator = computed(
    () =>
      meetingPermissionMap.value?.get(appStore.userInfo.id + "") ===
      MeetingPermissionEnum.Host,
  );

  const counter = useInterval(1000);

  const handleMeetingScreenShare = () => {
    const sharePreId = streamList.value.find((p) => {
      return p.participant.getTrack?.(Track.Source.ScreenShare);
    })?.id;

    return sharePreId;
  };

  const handleUpdateScreenTrack = (stream?: MediaStream) => {
    const sharePreId = handleMeetingScreenShare();

    if (!stream) {
      state.shareStream = undefined;
    } else {
      state.shareStream = stream;

      meetingStore.shareScreenUserId = sharePreId ?? "";

      meetingStore.shareScreenSid = sharePreId ?? "";
    }
  };

  const handleParticipant = (
    participant: any,
    option: "remove" | null = null,
  ) => {
    if (!participant) return;

    const { identity } = participant;

    if (!identity) {
      console.log("handleParticipant identity null", participant);

      return;
    }

    const index = streamList.value.findIndex((item) => item.id === identity);

    const streamItem = streamList.value[index];

    switch (option) {
      case "remove":
        if (index > -1) {
          streamList.value[index]?.disconnect();

          streamList.value.splice(index, 1);
        }
        break;
      default:
        if (!isNil(streamItem)) {
          streamItem.updata(participant);
        } else {
          streamList.value.push(
            new ParticipantStream(
              participant,
              identity + "" == appStore.userInfo.id + "",
            ),
          );
        }
    }

    handleUpdateMeetingParticipants();
  };

  const handleParticipantFrequency = (participant: any) => {
    if (!participant) return;

    const { identity } = participant;

    const index = streamList.value.findIndex((item) => item.id === identity);

    streamList.value[index]?.updateFrequency(participant?.frequency ?? 0);
  };

  const handleParticipantNick = (participant: any) => {
    if (!participant) return;

    const { identity } = participant;

    const index = streamList.value.findIndex((item) => item.id === identity);

    streamList.value[index]?.updateNick(participant?.nick ?? "");
  };

  const publishData = <T>(
    data: DataChannelMessage<T>,
    destination?: RemoteParticipant[] | string[],
  ) => {
    onIMChatSend(JSON.stringify(data), destination as string[]);
  };

  const stopAllSelfTransfers = async () => {
    // 停止屏幕共享（如果有）
    state.isScreenShareEnabled && stopAudio();

    // 停止所有本地音频轨道

    // 停止所有本地视频轨道
    await stopShare();
  };

  const handleUpdateMeetingPermission = async () => {
    const { code, msg, data } = await getAllUserInfo(meetingId.value);

    const roleAry: [string, MeetingPermissionEnum][] = [];

    if (code !== 200 || data.meetingUserSessions.length < 0) {
      throw Error(msg);
    }

    data.meetingUserSessions.forEach((item: MeetingUserSessionProps) => {
      if (item?.isMeetingMaster) {
        roleAry.push([item.userId + "", MeetingPermissionEnum.Host]);

        moderator.value = item;
      } else if (item?.coHost || item?.isMeetingCreator) {
        roleAry.push([item.userId + "", MeetingPermissionEnum.CoHost]);
      }

      if (item?.isMeetingCreator) {
        creatorId.value = item.userId + "";

        meetingStore.updateCreator(item.userId + "", item.userName);
      }
    });

    meetingPermissionMap.value = new Map(roleAry);

    meetingStore.permissionList = roleAry;

    appStore.isModerator =
      new Map(roleAry).get(appStore.userInfo.id + "") ===
      MeetingPermissionEnum.Host;

    window.store.dispatch(
      StoreEventEnum.UpdateMeetingPermission,
      JSON.stringify(roleAry),
    );

    window.store.dispatch(
      StoreEventEnum.UpdateModerator,
      JSON.stringify(moderator.value),
    );
  };

  const handleUpdateMeetingParticipants = () => {
    const data = toRaw(streamList.value);

    meetingStore.streamList = data;

    window.store.dispatch(
      StoreEventEnum.UpdateMeetingParticipants,
      JSON.stringify(data),
    );
  };

  const { pause: pauseConnect, resume: resumeConnect } = useTimeoutPoll(
    async () => {
      loadingService.value = ElLoading.service({
        fullscreen: true,
      });

      try {
        const { data: sdkInfo } = await GetTencentKey();

        if (!isNil(sdkInfo?.resolution)) {
          videoResolution.value = sdkInfo.resolution;
        }

        trTcKeyStore.appId = Number(sdkInfo?.appId ?? 0);

        trTcKeyStore.sdkSecretKey = sdkInfo?.sdkSecretKey;

        if (isNil(sdkInfo) || isEmpty(sdkInfo)) {
          ElMessage.error("獲取key值為空");

          throw "獲取key值為空";
        }

        const { code, data } = await joinMeetingApi({
          meetingNumber: meetingQuery.meetingNumber,
          isMuted: meetingQuery.isMuted,
          securityCode: meetingQuery.securityCode,
        });

        if (
          code !== 200 &&
          isNil(data?.meeting?.token) &&
          isNil(data?.meeting?.id)
        ) {
          throw Error("joinMeetingApi error");
        }

        userIdentity.value = `${query.userName as string}_${data.userId}`;

        meetingStore.joinMeeting(
          meetingQuery.meetingNumber,
          userIdentity.value,
        );

        meetingInfo.value = data?.meeting ?? {};

        meetingId.value = data?.meeting?.id ?? "";

        await handleUpdateMeetingPermission();

        const { code: userCode, data: userData } = await getUserSession(
          data.meeting.meetingMasterUserId,
        );

        if (userCode !== 200) {
          throw Error("getUserSession error");
        }

        targetLanguageType.value = data?.meetingUserSetting?.targetLanguageType;

        repeatType.value = data?.meeting?.repeatType ?? MeetingRepeatType.None;

        appointmentType.value =
          data?.meeting?.appointmentType ?? MeetingAppointmentType.Quick;

        meetingSubId.value = data?.meeting?.meetingSubId ?? "";

        meetingTitle.value = data?.meeting?.title ?? "";

        appStore.isOpenEA = data?.meeting?.isActiveEa ?? false;

        moderator.value = userData;

        registerEvent();

        initChat();

        meetingStore.isLocked = data?.meeting?.isLocked ?? false;

        meetingStore.meetingId = data?.meeting?.id ?? "";

        if (data.meeting.isActiveRecord) {
          recordingState.isRecording = true;

          TaskId.value = data?.taskId ?? "";

          recordingState.meetingRecordId = data?.meeting?.meetingRecordId ?? "";
        } else if (
          data?.meeting?.isRecorded &&
          appStore.isModerator &&
          !recordingState.isRecording
        ) {
          await onStartRecording();
        }

        loadingService.value?.close?.();

        pauseConnect();
      } catch (error) {
        ElMessage.warning((error as Error)?.message ?? error);
        if (counter.value > 120) {
          loadingService.value?.close?.();

          pauseConnect();

          messageBox(
            {
              message: "網絡異常，請檢查網絡設置，或嘗試重新入會。",
              showCancelButton: true,
              confirmButtonText: "重新入會",
              cancelButtonText: "離開會議",
            },
            (flag) => {
              flag === "confirm"
                ? emits("reloadToggle")
                : navigation.destroy("/room");
            },
          );
        }
      }
    },
    10000,
    {
      immediate: false,
      immediateCallback: true,
    },
  );

  const blockClose = async () => {
    /*    state.isScreenShareEnabled
          ? navigation.navigate("/room-leave-dialog")
          : leaveMeetingRef.value?.open()*/

    if (state.isScreenShareEnabled) {
      await stopShare();
    }

    leaveMeetingRef.value?.open();
  };

  const updateMicMuteStatus = async (status: boolean) => {
    meetingQuery.isMuted = status;

    recordSpeak();

    !status ? startAudio() : stopAudio();

    const participant = getParticipant(userIdentity.value);

    participant?.setMicrophoneEnabled(!status);

    // TaskId.value && updateRecord(userIdentity.value, status);

    handleParticipant(participant as any);
  };

  const updateCamera = async () => {
    const pass = await getMediaDeviceAccessAndStatus("camera", true);

    if (!pass) {
      ElMessage({
        message: "請授予麥克風權限",
        type: "error",
      });

      return;
    }

    if (isHasVideoTrack.value || state.isScreenShareEnabled) {
      ElMessage({
        message: "正在共享,无法重复共享",
        type: "warning",
      });

      return;
    }

    if (!meetingQuery.enableCamera) {
      startCamera();
    } else {
      stopCamera();
    }
  };

  const onStartRecording = async () => {
    try {
      await startRecord();

      recordingState.isRecording = true;

      nextTick(() => {
        recordSpeak();
      });

      sendRecording();
    } catch (error) {
      console.log(error);
    }
  };

  const onStopRecording = async () => {
    try {
      await stopRecord();

      recordingState.isRecording = false;

      speakRecordState.value = {
        id: undefined,
        meetingNumber: query.meetingNumber as string,
        meetingRecordId: "",
        trackId: "",
        speakStartTime: undefined,
        speakEndTime: undefined,
      };

      sendRecording();
    } catch (e) {
      ElMessage({
        message: "錄製結束失敗 " + (e as Error)?.message,
        type: "error",
      });
    }
  };

  const updateRecording = async () => {
    if (!isRecordDisable.value) {
      if (!recordingState.isRecording) {
        await onStartRecording();
      } else {
        await onStopRecording();
      }
    } else {
      ElMessage({
        message: "無權限操作錄製",
        type: "warning",
      });
    }
  };

  const beforeStartShare = (callback?: () => void) => {
    const sharePreId = handleMeetingScreenShare();

    if (sharePreId) {
      ElMessage({
        message: "他人正在共享，此時無法發起共享",
        type: "warning",
      });
      return true;
    }

    callback && callback();

    return false;
  };

  const startShare = (source: TRTCScreenCaptureSourceInfo) => {
    try {
      if (isHasVideoTrack.value || meetingQuery.enableCamera) {
        return ElMessage({
          message: "正在共享,无法重复共享",
          type: "warning",
        });
      }

      state.isScreenShareEnabled = true;

      const data: TRTCScreenCaptureSourceInfo[] =
        trtcCloud.getScreenCaptureSources(100, 100, 50, 50);

      const screen: TRTCScreenCaptureSourceInfo = data.find(
        (item) => item.sourceId === source.sourceId,
      )!;

      const view = document.createElement("div");

      trtcCloud.selectScreenCaptureTarget(
        screen,
        new Rect(0, 0, 0, 0),
        new TRTCScreenCaptureProperty(
          true, // enable capture mouse
          true, // enable highlight
          true, // enable high performance
          0xff66ff, // highlight color.
          8, // highlight width
          false, // disable capture child window
        ),
      );

      const screenShareEncParam = new TRTCVideoEncParam(
        ...(ScreenRecordingResolutionConst[videoResolution.value] as any),
      );

      trtcCloud.startScreenCapture(
        view,
        TRTCVideoStreamType.TRTCVideoStreamTypeSub,
        screenShareEncParam,
      );

      updateRecord(userIdentity.value, false);

      shareVideoUserId.value = userIdentity.value;

      const videoElement = view?.querySelector("video");

      if (videoElement && videoElement.srcObject) {
        const mediaStream = videoElement.srcObject as MediaStream;

        handleUpdateScreenTrack(mediaStream);
      }

      navigation.navigate("/share-canvas");
    } catch (e) {
      ElMessage.error("共享失敗 " + (e as Error)?.message);

      stopShare();
    }
  };

  const stopShare = async () => {
    trtcCloud.stopScreenCapture();

    updateRecord(userIdentity.value, true);

    shareVideoUserId.value = null;

    state.shareStream = undefined;

    state.isScreenShareEnabled = false;

    meetingStore.initDesktopSource();

    const paths: string[] = ["/share-screen-dialog", "/room-member-list"];

    paths.forEach((path) => {
      navigation.close(path);
    });

    isWhiteboardReady.value = false;
  };

  const endSharing = async () => {
    window.store.dispatch(StoreEventEnum.EndSharing, "").finally(() => {
      stopShare();
    });
  };

  const leaveMeeting = async () => {
    loadingService.value = ElLoading.service({ fullscreen: true });
    const isRepeatedMeeting =
      repeatType.value === MeetingRepeatType.None ||
      appointmentType.value === MeetingAppointmentType.Quick;
    try {
      await stopAllSelfTransfers();

      if (streamList.value.length <= 1 && recordingState.isRecording) {
        await onStopRecording();
      }

      await outMeetingApi({
        meetingId: meetingId.value,
        meetingSubId: isRepeatedMeeting ? undefined : meetingSubId.value,
      });
    } finally {
      await onExitRoom();
    }
  };

  const endMeeting = async () => {
    loadingService.value = ElLoading.service({ fullscreen: true });
    // 主持人发送DataChannel通知其他人结束会议
    publishData<DataChannelNotify>({
      command: DataChannelCommand.Notify,
      message: {
        type: DataChannelNotifyType.EndMeeting,
      },
    });
    try {
      await stopAllSelfTransfers();

      if (recordingState.isRecording) {
        await onStopRecording();
      }

      await endMeetingApi({
        meetingNumber: meetingQuery?.meetingNumber,
      });

      onDismissRoom();
    } finally {
      scheduleStore.updateItemStatus(meetingId.value, MeetingStatus.Completed);

      await onExitRoom();
    }
  };

  const closeRoom = async () => {
    try {
      await logoutGroup();
    } finally {
      loadingService.value?.close();
      appStore.isMeeting = false;
      navigation.destroy("/room");
    }
  };

  const sendDrawing = (drawingRecord: DrawingRecord) => {
    publishData({
      command: DataChannelCommand.Drawing,
      message: drawingRecord,
    });
  };

  const sendEchoAvatar = (type: EchoAvatarType, status?: boolean) => {
    publishData({
      command: DataChannelCommand.EchoAvatar,
      message: {
        EAType: type,
        echoAvatarSwitchStatus:
          type === EchoAvatarType.SwitchEA ? status : undefined,
      },
    });
  };

  const sendKicOutUser = (kicUserId: number | string) => {
    const kicOutSid =
      streamList.value.find((item) => item?.id === kicUserId)?.participant
        ?.sid ?? "";
    publishData(
      {
        command: DataChannelCommand.KicOutUser,
        message: {},
      },
      [kicOutSid],
    );
  };

  const sendRecording = () => {
    publishData({
      command: DataChannelCommand.Recording,
      message: {
        isRecording: recordingState.isRecording,
        meetingRecordId: recordingState.meetingRecordId,
        taskId: TaskId.value,
      },
    });
  };

  const onOpenTab = async (data: IRoomTabItemProps) => {
    roomContainerRef.value!.style.flex = `0 0 ${
      roomContainerRef?.value!.offsetWidth
    }px`;

    await roomTabRef?.value?.onOpenTab(data);

    roomContainerRef.value!.style.flex = `1`;
  };

  const onResetShare = async (source: ScreenSource, isShareAudio: boolean) => {
    await stopShare();
  };

  const handleParticipantDuration = () => {
    let _format = (num: number) => (num < 10 ? `0${num}` : `${num}`);

    let hour = Math.floor((counter.value / 3600) % 24);

    let minute = Math.floor((counter.value / 60) % 60);

    let second = Math.floor(counter.value % 60);

    state.participateDuration = `${_format(hour)}:${_format(minute)}:${_format(
      second,
    )}`;
  };

  const handleMemberListDataReceived = (params: IDataEventProps) => {
    const data = params.data;

    const kicSid =
      streamList.value.find((item) => item?.id === data?.id)?.participant
        ?.sid ?? "";

    const isLocal = kicSid === userIdentity.value;

    switch (params.type) {
      case MemberListEventEnum.ChangeName:
        if (isLocal) {
        } else {
          publishData(
            {
              command: DataChannelCommand.SetName,
              message: {
                name: data?.name,
                destination: kicSid,
              },
            },
            [kicSid],
          );
        }
        break;
      case MemberListEventEnum.Mute:
        if (isLocal) {
          updateMicMuteStatus(data?.isMuted);
        } else {
          publishData(
            {
              command: DataChannelCommand.SetSilent,
              message: {
                isSilent: data?.isMuted,
                destination: kicSid,
              },
            },
            [kicSid],
          );
        }

        break;
      case MemberListEventEnum.AllMute:
        updateMicMuteStatus(data);

        publishData({
          command: !data
            ? DataChannelCommand.AllTalk
            : DataChannelCommand.AllSilent,
          message: {},
        });

        break;
      case MemberListEventEnum.Role:
        updateMeetingRole({
          meetingId: meetingId.value,
          userId: data.userId,
          newRole: data.permission,
          isCoHost:
            data.permission === MeetingPermissionEnum.Host
              ? null
              : data.isCoHost,
        })
          .then(async () => {
            publishData({
              command: DataChannelCommand.UpdateRole,
              message: {},
            });

            handleUpdateMeetingPermission();
          })
          .catch(() => {
            ElMessage.error("操作失敗");
          });

        break;
      case MemberListEventEnum.Remove:
        publishData(
          {
            command: DataChannelCommand.RemoveUser,
            message: {
              destination: kicSid,
            },
          },
          [kicSid],
        );

        break;
      case MemberListEventEnum.Wait:
        break;
      case MemberListEventEnum.SetWait:
        break;
      case MemberListEventEnum.AllWait:
        break;
      case MemberListEventEnum.RemoveWait:
        break;
      default:
        break;
    }
  };

  const onScreenShareClick = async () => {
    // beforeStartShare(() => navigation.navigate("/share-screen-dialog"));

    const pass = await getMediaDeviceAccessAndStatus("screen", true);

    if (!pass) {
      return ElMessage({
        message: "請授予共享屏幕權限",
        type: "error",
      });
    }

    if (isHasVideoTrack.value || meetingQuery.enableCamera) {
      return ElMessage({
        message: "正在共享,无法重复共享",
        type: "warning",
      });
    }

    navigation.navigate("/share-screen-dialog");
  };

  const onMoreFunction = (command: string) => {
    switch (command) {
      case "draw": {
        window.store.dispatch(StoreEventEnum.OpenDrawingTool, "");

        drawingBoardRef.value?.toggleDrawingTool();

        break;
      }
      default: {
        break;
      }
    }
  };

  const onOpenMemberList = () => {
    navigation.navigate("/room-member-list");
  };

  const onSecureFunction = useDebounceFn(
    async (command: SecurityMenuSubscribeEnum) => {
      switch (command) {
        case SecurityMenuSubscribeEnum.Lock: {
          await updateMeetingLock({
            meetingId: meetingStore.meetingId,
            isLocked: !meetingStore.isLocked,
          }).then((res) => {
            meetingStore.isLocked = res.data;

            const tip = res.data
              ? "已鎖定，新成員將無法加入"
              : "已解鎖，新成員將可以加入";

            messageServices(tip);

            publishData({
              command: DataChannelCommand.UpdateSecure,
              message: SecurityMenuSubscribeEnum.Lock,
            });
          });

          break;
        }
        default: {
          break;
        }
      }
    },
    300,
  );

  const onOpenSecurityMenu = async () => {
    const { x } = await window.screenAPi.cursorPoint();

    const { y, height } = await window.electronAPI
      .getCurrentWindow()
      .onGetWindowSize("/room");

    roomSharingRef.value?.keepExpanding();

    navigation.navigate(
      "/meeting-dropdown-menu",
      {},
      {
        x: x - 80,
        y: y + height,
        width: 160,
        height: 50,
        parent: true,
      },
    );
  };

  onMounted(() => {
    appStore.isMeeting = true;

    appStore.isOpenEA = false;

    /**
     * 阻止窗口关闭，唤起自定义关闭窗口
     */
    navigation.blockClose(blockClose);

    resumeConnect();
  });

  onMounted(() => {
    navigator.mediaDevices.ondevicechange = async (e) => {
      const inputDeviceId = await manageDevices.getAudioDefaultInputDevice();

      settingsStore.audioInputDeviceId = inputDeviceId?.deviceId ?? "default";
    };
  });

  onBeforeMount(() => {
    meetingStore.init();
  });

  onUnmounted(() => {
    meetingStore.init();
  });

  watchEffect(() => {
    handleParticipantDuration();
  });

  watch(
    () => settingsStore.audioInputDeviceId,
    async (val) => {
      trtcCloud.setCurrentMicDevice(val);
    },
  );

  onMounted(() => {
    window.store.subscribe(async (key, value) => {
      switch (key) {
        case StoreEventEnum.ShareScreen:
          state.isScreenShareEnabled && (await stopShare());

          const sourceWindow = JSON.parse(value) as any;

          meetingStore.setDesktopSource(sourceWindow);

          startShare(sourceWindow);
          break;
        case StoreEventEnum.MemberListDataReceived: {
          const data = JSON.parse(value);

          handleMemberListDataReceived(data);

          break;
        }
        case StoreEventEnum.LeaveMeeting: {
          if (value === "end" && isModerator) {
            await endMeeting();
          } else if (value === "leave") {
            await leaveMeeting();
          }
        }
        case StoreEventEnum.SendDrawing: {
          !state.isScreenShareEnabled && sendDrawing(JSON.parse(value));

          break;
        }
        case StoreEventEnum.UpdateMeetingSecure: {
          const hash = value as SecurityMenuSubscribeEnum;

          switch (hash) {
            case SecurityMenuSubscribeEnum.Lock: {
              meetingStore.isLocked = !meetingStore.isLocked;

              const tip = meetingStore.isLocked
                ? "已鎖定，新成員將無法加入"
                : "已解鎖，新成員將可以加入";

              messageServices(tip);

              publishData({
                command: DataChannelCommand.UpdateSecure,
                message: SecurityMenuSubscribeEnum.Lock,
              });

              break;
            }
            case SecurityMenuSubscribeEnum.Close: {
              setTimeout(() => {
                roomSharingRef.value?.autoShrink();
              }, 3000);
              break;
            }
            default: {
              break;
            }
          }
        }
        case StoreEventEnum.WhiteboardSendMessage: {
          handleTEduBoardEventTebSyncData(value);
          break;
        }
        case StoreEventEnum.WhiteboardReady: {
          isWhiteboardReady.value = true;
        }
        default:
          break;
      }
    });
  });

  watch(
    () => streamList.value.length,
    (val) => {
      roomTabRef?.value?.onUpdateTab({
        name: TabsEnum.MemberList,
        title: `${TabsEnum.MemberList}(${val ?? 0})`,
      });
    },
  );

  // trtc
  const sdkInfo = ref<{ sdkAppId: number; userSig: any; sdkSecretKey: string }>(
    {
      sdkAppId: 0,
      userSig: "",
      sdkSecretKey: "",
    },
  );

  const shareVideoUserId = ref<string | null>();

  class TParticipant {
    sid: string;
    identity: string;
    name?: string;
    nick?: string;
    isMuted: boolean = true;
    isShared: boolean = false;
    isSubscribed: boolean = false;
    frequency: number = 0;

    constructor(trtcid: string) {
      const info = TParticipant.getIds(trtcid);
      this.identity = info[1];
      this.sid = trtcid;
      this.name = info[0];
      this.nick = info[0];
    }

    public setMicrophoneEnabled(val: boolean) {
      this.isMuted = !val;
    }

    public setScreenShareEnabled(val: boolean) {
      this.isShared = val;
    }

    public getTrack(type: Track.Source) {
      let result = false;

      switch (type) {
        case Track.Source.Microphone: {
          result = !this.isMuted;
          break;
        }
        case Track.Source.ScreenShare: {
          result = this.isShared;
        }
      }
      return {
        isSubscribed: result,
      };
    }

    static getIds(id: string) {
      const lastIndex = id.lastIndexOf("_");

      if (lastIndex === -1) {
        return [id, id];
      }

      const firstPart = id.substring(0, lastIndex);

      const secondPart = id.substring(lastIndex + 1);

      return [firstPart, secondPart];
    }
  }

  const userIdentity = ref<string>("");

  const isHasVideoTrack = ref(false);

  const getParticipant = (userId: string) => {
    const id = TParticipant.getIds(userId).at(1);

    const p = streamList.value.find((item) => item.id === id)!;

    if (!p) return;

    const p2 = new TParticipant(userId);

    p2.setMicrophoneEnabled(!p.isMuted);

    p2.setScreenShareEnabled(
      !!p.participant.getTrack?.(Track.Source.ScreenShareAudio),
    );

    p2.nick = !isEmpty(p?.nick) ? p.nick : p?.name ?? "";

    p2.frequency = p.frequency;

    return p2;
  };

  const trtcCloud = TRTCCloud.getTRTCShareInstance();

  const trTcKeyStore = useTrtcKeyStore();

  const enterRoom = () => {
    let param = new TRTCParams();
    param.sdkAppId = sdkInfo.value.sdkAppId;
    param.userSig = sdkInfo.value.userSig;
    param.roomId = Number(query.meetingNumber);
    param.userId = userIdentity.value;
    trtcCloud.enterRoom(param, TRTCAppScene.TRTCAppSceneVideoCall);
    trtcCloud.enableAudioVolumeEvaluation(300);
  };

  const registerEvent = () => {
    trtcCloud
      // 失敗
      .on("onError", (errCode: number, errMsg: string) => {
        console.log(`App.vue onError:`, errCode, errMsg);
      })
      // 等待
      .on("onWarning", (code: number, msg: string, extra: any) => {
        console.log(`App.vue onWarning:`, code, msg, extra);
      })
      // 進入房間
      .on("onEnterRoom", (result: number) => {
        console.log(`App.vue onEnterRoom:`, result);

        handleParticipant(new TParticipant(userIdentity.value) as any);

        handleUpdateMeetingPermission();
      })
      // 有用户加入当前房间
      .on("onRemoteUserEnterRoom", (userId: string) => {
        console.log(`App.vue onRemoteUserEnterRoom:`, userId);

        handleParticipant(new TParticipant(userId) as any);

        updateNick(userId);

        handleUpdateMeetingPermission();
      })
      // 用户是否开启摄像头视频
      .on("onUserVideoAvailable", (userId: string, available: number) => {
        console.log(`App.vue onUserVideoAvailable:`, userId, available);

        const participant = getParticipant(userId);

        console.log("---onUserSubStreamAvailable---", participant);

        let mediaStream = undefined;

        shareVideoUserId.value = null;

        if (available === 1) {
          shareVideoUserId.value = userId;

          isHasVideoTrack.value = true;

          const view = document.createElement("div");

          trtcCloud.startRemoteView(
            userId,
            view,
            TRTCVideoStreamType.TRTCVideoStreamTypeBig,
          );

          const videoElement = view?.querySelector("video");

          if (videoElement && videoElement.srcObject) {
            mediaStream = videoElement.srcObject as MediaStream;
            participant?.setScreenShareEnabled(true);
          }
        } else if (available === 0) {
          isHasVideoTrack.value = false;
          trtcCloud.stopRemoteView(userId);
          participant?.setScreenShareEnabled(false);
        }

        handleParticipant(participant as any);

        handleUpdateScreenTrack(mediaStream);
      })
      .on("onUserSubStreamAvailable", (userId: string, available: number) => {
        console.log(`App.vue onUserSubStreamAvailable:`, userId, available);

        const participant = getParticipant(userId);

        console.log("---onUserSubStreamAvailable---", participant);

        let mediaStream = undefined;

        shareVideoUserId.value = null;

        if (available === 1) {
          shareVideoUserId.value = userId;

          isHasVideoTrack.value = true;

          const view = document.createElement("div");

          trtcCloud.startRemoteView(
            userId,
            view,
            TRTCVideoStreamType.TRTCVideoStreamTypeSub,
          );

          const videoElement = view?.querySelector("video");

          if (videoElement && videoElement.srcObject) {
            mediaStream = videoElement.srcObject as MediaStream;
            participant?.setScreenShareEnabled(true);
          }
        } else if (available === 0) {
          isHasVideoTrack.value = false;
          trtcCloud.stopRemoteView(userId);
          participant?.setScreenShareEnabled(false);
        }

        handleParticipant(participant as any);

        handleUpdateScreenTrack(mediaStream);
      })
      // 有用户离开当前房间
      .on("onRemoteUserLeaveRoom", (userId: string, reason: number) => {
        console.log(`App.vue onRemoteUserLeaveRoom:`, userId, reason);

        handleParticipant(new TParticipant(userId) as any, "remove");
      })
      // userId 对应的成员语音音量
      .on(
        "onUserVoiceVolume",
        (
          userVolumes: Array<any>,
          userVolumesCount: number,
          totalVolume: number,
        ) => {
          let newSpeakersList: string[] = [];

          const localP = getParticipant(userIdentity.value);

          if (localP && !localP?.isMuted) {
            localP.frequency = userVolumes.at(0).volume ?? 0;
            handleParticipantFrequency(localP);

            userVolumes.at(0).volume > 10 &&
              localP?.nick &&
              newSpeakersList.push(localP.nick);
          }

          for (let i = 1, item = null; (item = userVolumes[i++]); ) {
            const p = getParticipant(item.userId);

            if (p && !p.isMuted) {
              p.frequency = item.volume;

              handleParticipantFrequency(p);

              item.volume > 10 && p?.nick && newSpeakersList.push(p.nick);
            }
          }

          speakersList.value = newSpeakersList;
        },
      )
      // 离开房间
      .on("onExitRoom", (reason: number) => {
        if (reason == 0) {
          console.log(
            "Exit current room by calling the 'exitRoom' api of sdk ...",
          );
        } else if (reason == 1) {
          console.log(
            "Kicked out of the current room by server through the restful api...",
          );
        } else if (reason == 2) {
          console.log(
            "Current room is dissolved by server through the restful api...",
          );
        }

        closeRoom();
      })
      .on("onUserAudioAvailable", (userId: string, available: number) => {
        const participant = getParticipant(userId);

        console.log("----onUserAudioAvailable-----", participant);

        if (available === 1) {
          participant?.setMicrophoneEnabled(true);
        } else if (available == 0) {
          participant?.setMicrophoneEnabled(false);
        }

        handleParticipant(participant);
      });
    /*      .on("onStatistics", (statis) => {
        console.log("---onStatistics---", statis);
      });*/
  };

  const startAudio = () => {
    trtcCloud.startLocalAudio(TRTCAudioQuality.TRTCAudioQualitySpeech);
  };

  const stopAudio = () => {
    trtcCloud.stopLocalAudio();
  };

  const onMuteAudio = (isMute: boolean) => {
    trtcCloud.muteLocalAudio(isMute);
  };

  const startCamera = () => {
    const view = document.createElement("div");

    trtcCloud.startLocalPreview(view);

    updateRecord(userIdentity.value, false);

    shareVideoUserId.value = userIdentity.value;

    const videoElement = view?.querySelector("video");

    if (videoElement && videoElement.srcObject) {
      const mediaStream = videoElement.srcObject as MediaStream;

      handleUpdateScreenTrack(mediaStream);

      meetingQuery.enableCamera = true;
    }
  };

  const stopCamera = () => {
    trtcCloud.stopLocalPreview();

    updateRecord(userIdentity.value, true);

    handleUpdateScreenTrack();

    meetingQuery.enableCamera = false;

    shareVideoUserId.value = null;
  };

  // im
  const chatRef = shallowRef() as ShallowRef<ChatSDK>;

  const dataChannel = (text: string) => {
    try {
      const data: DataChannelMessage<any> = JSON.parse(text);

      const isTarget = data.message?.destination === userIdentity.value;

      switch (data.command) {
        case DataChannelCommand.Notify: {
          const message: DataChannelNotify = data.message;
          switch (message.type) {
            case DataChannelNotifyType.EndMeeting:
              stopAllSelfTransfers().finally(() => {
                nextTick(() => {
                  leaveMeetingRef.value?.openEnd();
                });
              });
          }
          return;
        }
        case DataChannelCommand.Drawing: {
          const message: DrawingRecord = data.message;

          if (state.isScreenShareEnabled) {
            window.store.dispatch(
              StoreEventEnum.UpdateDrawingBoard,
              JSON.stringify(message),
            );
          } else {
            drawingBoardRef.value?.syncData(message);
          }

          return;
        }
        case DataChannelCommand.EchoAvatar: {
          const message = data.message;
          switch (message.EAType) {
            case EchoAvatarType.GetList: {
              echoAvatarRef.value?.getList();
              return;
            }
            case EchoAvatarType.SwitchEA: {
              appStore.isOpenEA = message.echoAvatarSwitchStatus;
              const { onOpenEA } = useEchoAvatar();
              onOpenEA();
              return;
            }
          }
          return;
        }
        case DataChannelCommand.KicOutUser: {
          isTarget && leaveMeeting();
          return;
        }
        case DataChannelCommand.AllSilent: {
          updateMicMuteStatus(true);
          return;
        }
        case DataChannelCommand.AllTalk:
          updateMicMuteStatus(false);

          break;
        case DataChannelCommand.SetSilent:
          isTarget && updateMicMuteStatus(!!data.message.isSilent);

          break;
        case DataChannelCommand.Recording: {
          const message = data.message;
          recordingState.isRecording = message?.isRecording ?? false;
          recordingState.meetingRecordId = message?.meetingRecordId ?? "";
          TaskId.value = message?.taskId ?? "";
          recordSpeak();
          return;
        }
        case DataChannelCommand.SetName: {
          room.value?.localParticipant?.setName(data.message.name);

          handleUpdateMeetingParticipants();

          break;
        }
        case DataChannelCommand.RemoveUser: {
          if (isTarget) {
            onExitRoom().finally(() => {
              leaveMeetingRef.value?.onRemove();
            });
          }

          break;
        }
        case DataChannelCommand.UpdateRole:
          handleUpdateMeetingPermission();

          break;
        case DataChannelCommand.UpdateSecure: {
          switch (data.message) {
            case SecurityMenuSubscribeEnum.Lock: {
              getMeetingInfoApi({
                meetingNumber: meetingQuery.meetingNumber,
                includeUserSession: false,
              }).then(({ code, data }) => {
                if (code === 200) {
                  meetingStore.isLocked = data.isLocked;
                }
              });

              break;
            }
            default: {
              break;
            }
          }
        }
      }
    } catch {}
  };

  let onSdkReady = function () {
    chatRef.value
      .joinGroup({ groupID: query.meetingNumber as string })
      .then((res) => {
        console.log("加入群组成功");
        // 加入成功，群存在
      })
      .catch((error) => {
        if (error.code === 10015) {
          console.log("⚠️ 群组不存在，尝试创建");
          chatRef.value
            .createGroup({
              groupID: query.meetingNumber as string,
              name: `会议 ${query.meetingNumber}`,
              type: TencentCloudChat.TYPES.GRP_MEETING,
            })
            .then(() => {
              console.log("✅ 创建群组成功，自动加入");
              return chatRef.value.joinGroup({
                groupID: query.meetingNumber as string,
              });
            })
            .catch((createErr) => {
              console.error("❌ 创建群组失败", createErr);
            });
        } else {
          console.error("❌ 其他加入失败", error);
        }
      })
      .finally(() => {
        enterRoom();
      });
  };

  let onSdkNotReady = function (event: any) {
    // chatRef.value.login({userID: 'your userID', userSig: 'your userSig'});
    console.log("onSdkNotReady", "----", event);
  };

  let onMessageReceived = function (event: any) {
    // event.data - 存储 Message 对象的数组 - [Message]
    console.log("onMessageReceived", "----", event);

    // event.data - 存储 Message 对象的数组 - [Message]
    const messageList = event.data;

    messageList.forEach(
      (
        message:
          | {
              to: string;
              type: TencentCloudChat.TYPES;
              payload: {
                text?: any;
                operationType?: any;
                userDefinedField?: any;
              };
              conversationType: TencentCloudChat.TYPES;
            }
          | any,
      ) => {
        if (message.to !== query.meetingNumber) return;

        if (message.type === TencentCloudChat.TYPES.MSG_TEXT) {
          // 文本消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.TextPayload
          const { text } = message.payload;

          try {
            const data = JSON.parse(text);

            if (data?.command === DataChannelCommand.MSG_GRP_TIP) {
              const { type, data: sid } = data?.message;

              switch (type) {
                case MsgGrpTip.GRP_TIP_MBR_JOIN: {
                  break;
                }
                case MsgGrpTip.GRP_TIP_GRP_PROFILE_UPDATED: {
                  updateNick(sid);

                  break;
                }
                case MsgGrpTip.GRP_TIP_MBR_KICKED_OUT: {
                  break;
                }
                case MsgGrpTip.GRP_TIP_MBR_QUIT: {
                  break;
                }
                default: {
                  break;
                }
              }
            }
          } catch {}

          dataChannel(text ?? "");
        } else if (message.type === TencentCloudChat.TYPES.MSG_IMAGE) {
          // 图片消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.ImagePayload
        }
        // else if (message.type === TencentCloudChat.TYPES.MSG_SOUND) {
        //   // 音频消息 - https://web.sdk.qcloud.com/im/doc/v3/zh-cn/Message.html#.AudioPayload
        // }
        else if (message.type === TencentCloudChat.TYPES.MSG_VIDEO) {
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

        // 群组消息
        if (message.conversationType === TencentCloudChat.TYPES.CONV_GROUP) {
          if (message.to === query.meetingNumber) {
            // 如果是当前课堂，这里需要注意一定只能接受当前课堂群组的信令。如果用户加入多个im群组，恰巧这几个群组也在上课，白板信令则会多个课堂错乱，引发互动白板不能同步的异常行为。
            let elements = message.getElements();
            if (elements.length) {
              elements.forEach((element: any) => {
                console.log(element);
                if (element.type === "TIMCustomElem") {
                  if (element.content.extension === "TXWhiteBoardExt") {
                    if (message.from != userIdentity.value) {
                      console.log("过滤自己本人的操作信令");
                      console.log(element.content.data);

                      drawingBoardRef.value?.syncData(element.content.data);

                      window.store.dispatch(
                        StoreEventEnum.WhiteboardSyncData,
                        JSON.stringify(element.content.data),
                      );
                    }
                  }
                }
              });
            }
          } else {
            // 其他群组消息忽略
          }
        }
      },
    );
  };

  const initChat = () => {
    const appId = Number(trTcKeyStore.appId);
    const sdkSecretKey = trTcKeyStore.sdkSecretKey;
    sdkInfo.value = {
      ...genTestUserSig(userIdentity.value, appId, sdkSecretKey),
      sdkSecretKey,
    };

    chatRef.value = TencentCloudChat.create({
      SDKAppID: sdkInfo.value.sdkAppId,
    });

    chatRef.value.setLogLevel(0); // 普通级别，日志量较多，接入时建议使用

    chatRef.value.registerPlugin({ "tim-upload-plugin": TIMUploadPlugin });

    chatRef.value.on(TencentCloudChat.EVENT.SDK_READY, () => {
      console.log("---SDK_READY---");

      onSdkReady();
    });
    chatRef.value.on(TencentCloudChat.EVENT.SDK_NOT_READY, onSdkNotReady);
    chatRef.value.on(
      TencentCloudChat.EVENT.MESSAGE_RECEIVED,
      onMessageReceived,
    );
    chatRef.value.on(
      TencentCloudChat.EVENT.NET_STATE_CHANGE,
      function (event: any) {
        // 网络状态发生改变
        // event.name - TencentCloudChat.EVENT.NET_STATE_CHANGE
        // event.data.state 当前网络状态，枚举值及说明如下：
        //   - TencentCloudChat.TYPES.NET_STATE_CONNECTED - 已接入网络
        //   - TencentCloudChat.TYPES.NET_STATE_CONNECTING - 连接中。很可能遇到网络抖动，SDK 在重试。接入侧可根据此状态提示“当前网络不稳定”或“连接中”
        //   - TencentCloudChat.TYPES.NET_STATE_DISCONNECTED - 未接入网络。接入侧可根据此状态提示“当前网络不可用”。SDK 仍会继续重试，若用户网络恢复，SDK 会自动同步消息
        switch (event.data.state) {
          case TencentCloudChat.TYPES.NET_STATE_CONNECTED:
            console.log("网络状态：已接入网络");

            drawingBoardRef?.value?.syncAndReload();

            window.store.dispatch(StoreEventEnum.WhiteboardSendAddAckData, "");
            break;
          case TencentCloudChat.TYPES.NET_STATE_CONNECTING:
            console.log("网络状态：连接中");
            break;
          case TencentCloudChat.TYPES.NET_STATE_DISCONNECTED:
            console.log("网络状态：未接入网络");
            break;
        }
      },
    );

    console.log("---chatLogin---", userIdentity.value, sdkInfo.value);

    chatRef.value
      .login({ userID: userIdentity.value, userSig: sdkInfo.value.userSig })
      .then((res) => {
        const LoginUser = chatRef.value.getLoginUser();

        console.log("✅ login 成功", res, LoginUser);
      })
      .catch((err) => {
        console.error("❌ login 失败", err);
      });
  };

  const onIMChatSend = (data: string, destination?: string[]) => {
    let message = chatRef.value.createTextMessage({
      to: query.meetingNumber as string,
      conversationType: TencentCloudChat.TYPES.CONV_GROUP,
      // 消息优先级，用于群聊。如果某个群的消息超过了频率限制，后台会优先下发高优先级的消息，详细请参考：https://cloud.tencent.com/document/product/269/3663#.E6.B6.88.E6.81.AF.E4.BC.98.E5.85.88.E7.BA.A7.E4.B8.8E.E9.A2.91.E7.8E.87.E6.8E.A7.E5.88.B6)
      // 支持的枚举值：TencentCloudChat.TYPES.MSG_PRIORITY_HIGH, TencentCloudChat.TYPES.MSG_PRIORITY_NORMAL（默认）, TencentCloudChat.TYPES.MSG_PRIORITY_LOW, TencentCloudChat.TYPES.MSG_PRIORITY_LOWEST
      // priority: TencentCloudChat.TYPES.MSG_PRIORITY_NORMAL,

      // https://web.sdk.qcloud.com/im/doc/v3/zh-cn/SDK.html#sendMessage 不同消息类型可以通过这个查看
      payload: {
        text: data,
      },
      // 消息自定义数据（云端保存，会发送到对端，程序卸载重装后还能拉取到）
      // cloudCustomData: 'your cloud custom data'
      // receiverList: destination,
    });

    let promise = chatRef.value.sendMessage(message);

    let sendResult = undefined;

    promise
      .then(function (imResponse) {
        // 发送成功
        console.log(imResponse);

        sendResult = "1";
      })
      .catch(function (imError) {
        sendResult = "0";
        // 发送失败
        console.warn("sendMessage error:", imError);
      });
  };

  const onExitRoom = async () => {
    trtcCloud.exitRoom();
  };

  const onDismissRoom = async () => {
    const dismissResult = await window.electronAPI.DismissRoom({
      SdkAppId: sdkInfo.value.sdkAppId,
      RoomId: query.meetingNumber as string,
    });

    if (dismissResult.success) {
      console.log("退出成功");
    } else {
      console.error("退出失败", dismissResult.error);
    }
  };

  const logoutGroup = async () => {
    try {
      const res = await chatRef.value.getGroupProfile({
        groupID: query.meetingNumber as string,
      });

      if (
        res?.data?.group?.ownerID &&
        localStream.value?.participant?.sid &&
        res.data.group.ownerID != localStream.value?.participant.sid
      ) {
        await chatRef.value.quitGroup(query.meetingNumber as string);
      }
    } finally {
      await chatRef.value.logout();
    }
  };

  // record
  const TaskId = ref("");

  const startRecord = async () => {
    const params: any = {
      sdkAppId: sdkInfo.value.sdkAppId,
      roomId: query.meetingNumber as string,
      roomIdType: 0,
      recordParams: {
        recordMode: 2,
        outputFormat: 3,
      },
      mixTranscodeParams: {
        videoParams: {
          width: 1920,
          height: 1080,
          fps: 60,
          bitRate: 8192000,
          gop: 10,
        },
      },
      PlaceHolderMode: 1,
      MixLayoutParams: {
        MixLayoutMode: 4,
        MediaId: 0,
        MixLayoutList: [
          {
            Top: 0,
            Left: 0,
            Width: 1920,
            Height: 1080,
            RenderMode: 0,
          },
        ],
      },
    };

    if (!isEmpty(shareVideoUserId.value) && !isNil(shareVideoUserId.value)) {
      params.MixLayoutListUserId = shareVideoUserId.value;

      params.MixLayoutParams.MixLayoutList[0].UserId = shareVideoUserId.value;
    }

    const { data, code, msg } = await CloudRecordCreate(params);

    if (code === 200) {
      console.log("开始录制成功", data, shareVideoUserId.value);
      TaskId.value = data.taskId;
      recordingState.meetingRecordId = data.meetingRecordId;
    } else {
      console.error("开始录制失败", msg);

      ElMessage({
        message: "錄製開啟失敗" + msg,
        type: "error",
      });

      throw msg;
    }
  };

  const stopRecord = async () => {
    if (TaskId.value !== "") {
      const stopResult = await CloudRecordStop({
        sdkAppId: sdkInfo.value.sdkAppId,
        taskId: TaskId.value,
      });

      if (stopResult.code === 200) {
        console.log("停止录制成功", stopResult.data);

        TaskId.value = "";
      } else {
        console.error("停止录制失败", stopResult.msg);
      }
    }
  };

  const updateRecord = async (userId: string, isStop: boolean = false) => {
    if (!TaskId.value) return;

    const MixLayoutList: {
      Top: number;
      Left: number;
      Width: number;
      Height: number;
      UserId?: string;
      RenderMode: number;
    }[] = [
      {
        Top: 0,
        Left: 0,
        Width: 1920,
        Height: 1080,
        RenderMode: 0,
      },
    ];

    if (userId !== null) {
      MixLayoutList[0].UserId = userId;
    }

    if (TaskId.value !== "") {
      const params: any = {
        sdkAppId: sdkInfo.value.sdkAppId,
        taskId: TaskId.value,
        MixLayoutParams: {
          MixLayoutMode: 4,
          MediaId: 0,
          MixLayoutList,
        },
      };

      const stopResult = await CloudRecordUpdate(params);

      if (stopResult.code === 200) {
        console.log("更新录制成功", stopResult.data);
      } else {
        console.error("更新录制失败", stopResult.msg);
      }
    }
  };

  const recordSpeak = async () => {
    if (!recordingState.isRecording) {
      return;
    }

    const speakData = speakRecordState.value;

    const request = {
      meetingNumber: speakData.meetingNumber,
      meetingRecordId: recordingState.meetingRecordId,
      trackId: "",
    };

    if (!meetingQuery.isMuted) {
      const { data, code, msg } = await recordSpeakApi({
        ...request,
        speakStartTime: Date.now(),
      });

      if (code === 200) {
        speakData.id = data?.id;
        speakData.speakStartTime = data?.speakStartTime;
      }
    } else if (speakData.id) {
      await recordSpeakApi({
        ...request,
        id: speakData.id,
        speakStartTime: speakData.speakStartTime,
        speakEndTime: Date.now(),
      });
    }
  };

  // whiteboard
  const isError = ref(false);

  const errorData = ref<any[]>([]);

  const handleTEduBoardEventTebSyncData = (data: string) => {
    console.log(data);

    let message = chatRef.value.createCustomMessage({
      to: meetingQuery.meetingNumber,
      conversationType: TencentCloudChat.TYPES.CONV_GROUP,
      priority: TencentCloudChat.TYPES.MSG_PRIORITY_HIGH, // 因为im消息有限频，白板消息的优先级调整为最高
      payload: {
        data: data,
        description: "",
        extension: "TXWhiteBoardExt", // 固定写法，各端会以extension: 'TXWhiteBoardExt'为标志作为白板信令
      },
    });

    chatRef.value.sendMessage(message).then(
      () => {
        // 同步成功
        console.log("发送成功");

        drawingBoardRef.value?.addAckData(data);

        window.store.dispatch(StoreEventEnum.WhiteboardSendAddAckData, data);
      },
      () => {
        console.error("发送失败");

        handleTEduBoardEventTebSyncData(data);
      },
    );
  };

  const tEduBoardEvent = (query: { type: string; data: string }) => {
    switch (query.type) {
      case "TEB_SYNCDATA":
        handleTEduBoardEventTebSyncData(query.data);

        break;
      default:
        break;
    }
  };

  const updateNick = async (sid: string) => {
    try {
      const response = await chatRef?.value?.getGroupMemberList({
        groupID: meetingQuery.meetingNumber,
        offset: 0,
      });

      const members = response.data.memberList || [];

      let m = members.find((member: any) => member.userID == sid);

      const p = getParticipant(sid);

      console.log("updateNick", m, p);

      m &&
        handleParticipantNick({
          ...p,
          nick: m?.nick ? m?.nick : p?.name,
        });
    } catch (err) {
      console.log(err);
    }
  };

  setInterval(() => {
    if (counter.value > 7200) {
      try {
        endMeeting();
      } catch {
        leaveMeeting();
      }
    }
  }, 60000);

  return {
    isWhiteboardReady,
    leaveMeetingRef,
    echoAvatarRef,
    drawingBoardRef,
    roomContainerRef,
    roomTabRef,
    appStore,
    localStream,
    streamList,
    meetingQuery,
    state,
    moderator,
    shareParticipant,
    speakersList,
    targetLanguageType,
    recordingState,
    meetingId,
    meetingTitle,
    blockClose,
    updateMicMuteStatus,
    updateCamera,
    beforeStartShare,
    startShare,
    stopShare,
    endSharing,
    leaveMeeting,
    endMeeting,
    sendDrawing,
    sendEchoAvatar,
    sendKicOutUser,
    onOpenTab,
    updateRecording,
    publishData,
    meetingPermissionMap,
    roomSharingRef,
    onResetShare,
    settingsStore,
    creatorId,
    echoAvatarBtnRef,
    handleMemberListDataReceived,
    isRecordDisable,
    onScreenShareClick,
    onMoreFunction,
    onOpenMemberList,
    meetingStore,
    onSecureFunction,
    onOpenSecurityMenu,
    tEduBoardEvent,
    userIdentity,
  };
};

export const useMouse = () => {
  const stoped = ref(false);

  const _timer = ref<NodeJS.Timeout>();

  const focused = useWindowFocus();

  const mousemove = useThrottleFn(() => {
    stoped.value = false;
    clearTimeout(_timer.value);
    _timer.value = setTimeout(() => {
      stoped.value = true;
    }, 3000);
  }, 100);

  onMounted(() => {
    document.body.addEventListener("mousemove", mousemove);
  });

  onUnmounted(() => {
    document.body.removeEventListener("mousemove", mousemove);
  });

  return {
    stoped,
    focused,
  };
};

export const useEchoAvatar = () => {
  const appStore = useAppStore();

  const onOpenEA = async () => {
    if (!appStore.isFullscreen) {
      const size = await window.electronAPI.getCurrentWindow().getSize("/room");
      if (appStore.isOpenEA) {
        await window.electronAPI
          .getCurrentWindow()
          .setSize(size[0] + 543, size[1], undefined, "/room");
      } else {
        await window.electronAPI
          .getCurrentWindow()
          .setSize(
            size[0] - 543,
            size[1] < 800 ? 800 : size[1],
            undefined,
            "/room",
          );
      }
    }
  };

  return {
    onOpenEA,
  };
};
