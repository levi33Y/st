import { useMessage } from "@/hooks/useMessage";
import RoomSharing from "@/screens/room/components/screen-share-menu/index.vue";
import { SecurityMenuSubscribeEnum } from "@/screens/room/props";
import {
  IDataEventProps,
  MemberListEventEnum,
} from "@components/member-list/props";
import {
  useDebounceFn,
  useInterval,
  useThrottleFn,
  useTimeoutPoll,
  useWindowFocus,
} from "@vueuse/core";
import { ElLoading, ElMessage } from "element-plus";
import { LoadingInstance } from "element-plus/es/components/loading/src/loading";
import {
  ConnectionState,
  DataPacket_Kind,
  Participant,
  ParticipantEvent,
  RemoteParticipant,
  Room,
  RoomEvent,
  Track,
  TrackPublication,
  VideoPresets,
} from "livekit-client";
import { debounce, isNil } from "lodash";
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
import DrawingBoard from "../../components/drawing-board/index.vue";
import {
  DataChannelCommand,
  DataChannelNotifyType,
  EchoAvatarType,
  MeetingAppointmentType,
  MeetingRepeatType,
  MeetingStatus,
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
  speakRecordApi,
  startRecordingApi,
  StopRecordingApi,
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
import { getSharingTrackByVb, waitAnimationFrames } from "./utils";

const utils = {
  encoder: new TextEncoder(),
  decoder: new TextDecoder(),
};

// const LivekitServer = "https://livekit-server.wiltechs.com"

const LivekitServer = "https://livekit-test.wiltechs.com";

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

  const speakRecordState = reactive<RecordSpeak>({
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

  const drawingBoardRef = ref<InstanceType<typeof DrawingBoard>>();

  const echoAvatarRef = ref<InstanceType<typeof EchoAvatar>>();

  const echoAvatarDialogRef = ref<InstanceType<typeof EchoAvatar>>();

  const roomContainerRef = ref<HTMLDivElement>();

  /**
   * 主持人信息
   */
  const moderator = ref<userBasicInfo>({} as userBasicInfo);

  const meetingInfo = ref<Meeting>({} as Meeting);

  const creatorId = ref<string>("");

  // 共享屏幕用户
  const shareParticipant = ref<Participant | undefined>();

  // 本地流信息
  const localStream = computed(() => {
    return streamList.value.find((stream) => stream.isLocal);
  });

  const speakersList = ref<string[]>([]);

  const targetLanguageType = ref<SpeechTargetLanguageType>();

  const roomTabRef = ref<InstanceType<typeof RoomTab>>();

  const roomSharingRef = ref<InstanceType<typeof RoomSharing>>();

  const echoAvatarBtnRef = ref<InstanceType<typeof EchoAvatarBtn>>();

  const loadingService = ref<LoadingInstance | null>(null);

  const isRecordDisable = computed(() =>
    isNil(meetingPermissionMap.value?.get(appStore.userInfo.id + "")),
  );

  const isModerator = computed(
    () =>
      meetingPermissionMap.value?.get(appStore.userInfo.id + "") ===
      MeetingPermissionEnum.Host,
  );

  const counter = useInterval(1000);

  const handleScreenShare = () => {
    if (room.value?.state !== ConnectionState.Connected) return;

    let participant: Participant | undefined;
    let screenSharePub: TrackPublication | undefined =
      room.value?.localParticipant.getTrack(Track.Source.ScreenShare);
    let screenShareAudioPub: TrackPublication | undefined;

    if (screenSharePub) {
      participant = room.value?.localParticipant;
      screenShareAudioPub ??= room.value?.localParticipant.getTrack(
        Track.Source.ScreenShareAudio,
      );
    } else {
      for (const [_, p] of room.value?.participants) {
        const pub = p.getTrack(Track.Source.ScreenShare);
        if (pub?.isSubscribed) {
          participant = p;
          screenSharePub = pub;
          const audioPub = p.getTrack(Track.Source.ScreenShareAudio);
          if (audioPub?.isSubscribed) {
            screenShareAudioPub = audioPub;
          }
          break;
        }
      }
    }

    shareParticipant.value = participant;

    if (screenSharePub && participant) {
      const videoTrack = screenSharePub?.videoTrack?.mediaStreamTrack;
      const audioTrack = screenShareAudioPub?.audioTrack?.mediaStreamTrack;
      if (state.shareStream) {
        if (videoTrack && state.shareStream.getVideoTracks().length === 0) {
          state.shareStream.addTrack(videoTrack);
        }
        if (audioTrack && state.shareStream.getAudioTracks().length === 0) {
          state.shareStream.addTrack(audioTrack);
        }
      } else {
        const shareStream = new MediaStream();
        videoTrack && shareStream.addTrack(videoTrack);
        audioTrack && shareStream.addTrack(audioTrack);
        if (shareStream.getTracks().length > 0) {
          state.shareStream = shareStream;
        }
      }
    } else {
      state.shareStream = undefined;
    }
  };

  const handleMeetingScreenShare = () => {
    const sharePreId = Array.from(room.value?.participants.values()).find(
      (p) => {
        const pub = p.getTrack(Track.Source.ScreenShare);

        const audioPub = p.getTrack(Track.Source.ScreenShareAudio);

        return pub?.isSubscribed || audioPub?.isSubscribed;
      },
    )?.sid;

    meetingStore.shareScreenSid = sharePreId ?? "";

    return sharePreId;
  };

  const handleUpdateScreenTrack = () => {
    if (room.value?.state !== ConnectionState.Connected) return;

    const sharePreId = handleMeetingScreenShare();

    let participant = sharePreId
      ? room.value?.participants.get(sharePreId)
      : room.value?.localParticipant;

    let videoTrack = participant?.getTrack(Track.Source.ScreenShare)?.videoTrack
      ?.mediaStreamTrack;

    // let audioTrack = participant?.getTrack(Track.Source.ScreenShareAudio)
    //   ?.audioTrack?.mediaStreamTrack

    if (!videoTrack) {
      state.shareStream = undefined;
    } else {
      const shareStream = new MediaStream();

      // const shareAudioStream = new MediaStream()

      videoTrack && shareStream.addTrack(videoTrack);

      // audioTrack && shareStream.addTrack(audioTrack)

      // audioTrack && shareAudioStream.addTrack(audioTrack)

      state.shareStream = shareStream;

      // state.shareAudioStream = shareAudioStream

      meetingStore.shareScreenUserId = participant?.identity ?? "";
    }
  };

  const handleParticipant = (
    participant: Participant,
    option: "remove" | null = null,
  ) => {
    if (!participant) return;

    const { identity } = participant;

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
              identity === room.value?.localParticipant.identity,
            ),
          );
        }
    }

    handleUpdateMeetingParticipants();
  };

  const handleSignalConnected = async () => {
    if (!meetingQuery.isMuted) {
      const pass = await getMediaDeviceAccessAndStatus("microphone");
      if (!pass) {
        meetingQuery.isMuted = true;
      }
    }

    await room.value?.localParticipant.setMicrophoneEnabled(
      !meetingQuery.isMuted,
      {
        deviceId: settingsStore?.audioInputDeviceId ?? "default",
        echoCancellation: true,
        noiseSuppression: true,
      },
    );

    if (meetingQuery.enableCamera) {
      const pass = await getMediaDeviceAccessAndStatus("camera");
      if (!pass) {
        meetingQuery.enableCamera = false;
      } else {
      }
    }
    await room.value?.localParticipant.setCameraEnabled(
      meetingQuery.enableCamera,
    );

    room.value?.localParticipant &&
      handleParticipant(room.value?.localParticipant);
  };

  const handleParticipantConnected = (participant: Participant) => {
    handleParticipant(participant);

    participant
      .on(ParticipantEvent.TrackMuted, () => {
        handleParticipant(participant);
      })
      .on(ParticipantEvent.TrackUnmuted, () => {
        handleParticipant(participant);
      })
      .on(ParticipantEvent.IsSpeakingChanged, (speaking) => {
        if (participant.isLocal && recordingState.isRecording) {
          // speakRecord(speaking);
        }
        handleParticipant(participant);
      })
      .on(ParticipantEvent.ConnectionQualityChanged, () => {
        handleParticipant(participant);
      })
      .on(ParticipantEvent.ParticipantNameChanged, () => {
        handleParticipant(participant);
      });
  };

  const handleDisconnected = async () => {
    if (state.isPopConnectErrorMessage) {
      await stopAllSelfTransfers();

      emits("reloadToggle");
    }
  };

  const publishData = <T>(
    data: DataChannelMessage<T>,
    destination?: RemoteParticipant[] | string[],
  ) =>
    room.value?.localParticipant.publishData(
      utils.encoder.encode(JSON.stringify(data)),
      DataPacket_Kind.RELIABLE,
      destination,
    );

  const stopAllSelfTransfers = async () => {
    // 停止屏幕共享（如果有）
    state.isScreenShareEnabled && (await stopShare());

    // 停止所有本地音频轨道
    const audioTracks = room.value?.localParticipant.audioTracks;
    audioTracks.forEach((trackPublication) => {
      trackPublication.track?.stop();
    });

    // 停止所有本地视频轨道
    const videoTracks = room.value?.localParticipant.videoTracks;
    videoTracks.forEach((trackPublication) => {
      trackPublication.track?.stop();
    });
  };

  const handleUpdateMeetingPermission = debounce(async () => {
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
  }, 300);

  const handleUpdateMeetingParticipants = () => {
    const data = toRaw(streamList.value);

    meetingStore.streamList = data;

    window.store.dispatch(
      StoreEventEnum.UpdateMeetingParticipants,
      JSON.stringify(data),
    );
  };

  const handleActiveSpeakersChanged = (speakers: Participant[]) => {
    const participants = streamList.value.map((item) => item.name);

    speakersList.value = speakers
      .map((speaker) => speaker.name ?? "")
      .filter((speaker) => participants.includes(speaker));
  };

  const { pause: pauseConnect, resume: resumeConnect } = useTimeoutPoll(
    async () => {
      loadingService.value = ElLoading.service({
        fullscreen: true,
      });

      try {
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

        meetingInfo.value = data?.meeting ?? {};

        const token = data?.meeting?.token ?? "";

        meetingId.value = data?.meeting?.id ?? "";

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

        room.value?.removeAllListeners();

        room.value = new Room({
          adaptiveStream: {
            pixelDensity: "screen",
            pauseVideoInBackground: false,
          },
          dynacast: false,
          videoCaptureDefaults: {
            resolution: VideoPresets.h1080.resolution,
          },
          publishDefaults: {
            screenShareEncoding: {
              maxBitrate: 8_000_000,
              maxFramerate: 60,
              priority: "high",
            },
            videoCodec: "vp9",
            screenShareSimulcastLayers: [VideoPresets.h1080],
          },
          stopLocalTrackOnUnpublish: true,
        });

        await room.value
          .prepareConnection(LivekitServer, token)
          .catch((error) => {
            throw new Error(error);
          });

        room.value
          .on(RoomEvent.SignalConnected, () => {
            handleUpdateMeetingPermission();

            handleSignalConnected();
          })
          .on(RoomEvent.ParticipantConnected, (participant) => {
            handleParticipantConnected(participant);

            handleUpdateMeetingPermission();
          })
          .on(RoomEvent.ParticipantDisconnected, (participant) => {
            participant.tracks.forEach((item) => {
              item?.setSubscribed(false);
            });

            handleParticipant(participant, "remove");

            handleUpdateMeetingPermission();
          })
          .on(RoomEvent.TrackSubscribed, async (_, __, participant) => {
            handleParticipant(participant);
            handleUpdateScreenTrack();
          })
          .on(RoomEvent.TrackUnsubscribed, (_, __, participant) => {
            handleParticipant(participant);
            requestAnimationFrame(handleUpdateScreenTrack);
          })
          .on(
            RoomEvent.TrackSubscriptionFailed,
            (trackSid: string, participant: RemoteParticipant) => {
              // https://github.com/livekit/livekit/issues/162
              // https://github.com/livekit/livekit/issues/166
              const remoteTrackPublication = participant.tracks.get(trackSid);

              remoteTrackPublication?.setSubscribed(false);

              setTimeout(() => {
                remoteTrackPublication?.setSubscribed(true);
              }, 2000);
            },
          )
          .on(RoomEvent.LocalTrackPublished, () => {
            handleParticipant(room.value?.localParticipant);
            handleUpdateScreenTrack();
          })
          .on(RoomEvent.LocalTrackUnpublished, () => {
            handleParticipant(room.value?.localParticipant);
            handleUpdateScreenTrack();
          })
          .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
          .on(RoomEvent.Reconnecting, () => {
            /*          loadingService.value = ElLoading.service({
              fullscreen: true,
              text: "連接出錯，嘗試重連中...",
            })*/

            state.isPopConnectErrorMessage = true;
          })
          .on(RoomEvent.Reconnected, () => {
            handleUpdateMeetingPermission();

            loadingService.value?.close?.();

            state.isPopConnectErrorMessage = false;
          })
          .on(RoomEvent.Disconnected, handleDisconnected)
          .on(RoomEvent.DataReceived, (payload) => {
            const message = utils.decoder.decode(payload);

            try {
              const data: DataChannelMessage<any> = JSON.parse(message);

              switch (data.command) {
                case DataChannelCommand.Notify: {
                  const message: DataChannelNotify = data.message;
                  switch (message.type) {
                    case DataChannelNotifyType.EndMeeting:
                      stopAllSelfTransfers();
                      leaveMeetingRef.value?.openEnd();
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
                    drawingBoardRef.value?.drawing(message);
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
                  leaveMeeting();
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
                  updateMicMuteStatus(!!data.message.isSilent);

                  break;
                case DataChannelCommand.Recording: {
                  const message = data.message;
                  recordingState.isRecording = message?.isRecording ?? false;
                  recordingState.meetingRecordId =
                    message?.meetingRecordId ?? "";
                  if (!meetingQuery.isMuted) recordSpeak();
                  return;
                }
                case DataChannelCommand.SetName: {
                  room.value?.localParticipant?.setName(data.message.name);

                  handleUpdateMeetingParticipants();

                  break;
                }
                case DataChannelCommand.RemoveUser: {
                  leaveMeetingRef.value?.onRemove();

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
          });

        await room.value
          .connect(LivekitServer, token, {
            autoSubscribe: true,
          })
          .catch((error) => {
            throw new Error(error);
          });

        if (room.value?.state !== ConnectionState.Connected) {
          throw new Error("room disconnected");
        }

        room.value?.localParticipant &&
          handleParticipantConnected(room.value?.localParticipant);

        room.value?.participants.forEach((participant) => {
          participant && handleParticipantConnected(participant);
        });

        //入会判断是否开启录制
        if (data?.meeting?.isActiveRecord) {
          recordingState.isRecording = true;

          recordingState.meetingRecordId = data?.meeting?.meetingRecordId ?? "";

          !meetingQuery.isMuted && recordSpeak();
        } else if (data?.meeting?.isRecorded && appStore.isModerator) {
          await updateRecording();
        }

        loadingService.value?.close?.();

        publishData<DataChannelNotify>({
          command: DataChannelCommand.Notify,
          message: {
            type: DataChannelNotifyType.Connect,
          },
        });

        meetingStore.isLocked = data?.meeting?.isLocked ?? false;

        meetingStore.meetingId = data?.meeting?.id ?? "";

        pauseConnect();
      } catch (error) {
        // ElMessage.warning((error as Error)?.message ?? error)
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

    await recordSpeak();

    await room.value?.localParticipant.setMicrophoneEnabled(!status, {
      deviceId: settingsStore?.audioInputDeviceId ?? "default",
      echoCancellation: true,
      noiseSuppression: true,
    });
  };

  const updateCamera = async () => {
    meetingQuery.enableCamera = !room.value?.localParticipant.isCameraEnabled;
    await room.value?.localParticipant.setCameraEnabled(
      meetingQuery.enableCamera,
    );
    room.value?.localParticipant &&
      handleParticipant(room.value?.localParticipant);
  };

  const onStartRecording = async () => {
    await startRecordingApi(meetingId.value)
      .then((res) => {
        if (res.code !== 200) {
          throw new Error("錄製開啟失敗");
        }

        recordingState.isRecording = true;
        recordingState.meetingRecordId = res?.meetingRecordId;
        recordingState.egressId = res?.egressId;
        sendRecording();
        if (!meetingQuery.isMuted) recordSpeak();
      })
      .catch(() => {
        recordingState.isRecording = false;

        ElMessage({
          message: "錄製開啟失敗",
          type: "error",
        });
      });
  };

  const onStopRecording = async () => {
    try {
      const stopData = {
        meetingId: meetingId.value,
        egressId: recordingState.egressId,
        meetingRecordId: recordingState.meetingRecordId,
      };

      /*    if (!recordingState.egressId) {
        let { data, code: egressCode } = await getRecordingEgressApi(
          meetingId.value
        )

        if (isNil(data)) {
          if (
            meetingInfo.value?.isActiveRecord &&
            meetingInfo.value?.id === meetingId.value
          ) {
            recordingState.isRecording = false

            sendRecording()
          }

          throw new Error("getRecordingEgressApi error")
        }

        recordingState.egressId = data
      }*/

      const { code } = await StopRecordingApi(stopData);

      if (code !== 200) {
        throw new Error("StopRecordingApi error");
      }

      recordingState.isRecording = false;

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

  const startShare = async (
    source: {
      id: string;
      displayId: string;
    },
    isShareAudio: boolean,
    isReset?: boolean,
  ) => {
    try {
      const result = await getSharingTrackByVb(source.id, isShareAudio);

      if (!result) {
        throw new Error("獲取共享失敗");
      }

      waitAnimationFrames(() => {
        result.track.videoTrack &&
          source &&
          room.value?.localParticipant.publishTrack(result.track.videoTrack, {
            name: "ScreenShare",
            source: Track.Source.ScreenShare,
            screenShareEncoding: {
              maxBitrate: 8_000_000,
              maxFramerate: 60,
              priority: "high",
            },
            videoCodec: "vp9",
            screenShareSimulcastLayers: [VideoPresets.h1080],
          });

        /*        result.track.audioTrack &&
          isShareAudio &&
          room.value?.localParticipant.publishTrack(result.track.audioTrack, {
            name: "ScreenShareAudio",
            source: Track.Source.ScreenShareAudio,
          })*/

        meetingStore.isScreenShareEnabled = true;
      });
    } catch (e) {
      ElMessage.error("共享失敗 " + (e as Error)?.message);

      stopShare();
    }
  };

  const stopShare = async () => {
    await room.value?.localParticipant?.setScreenShareEnabled(false, {
      audio: false,
    });

    const paths: string[] = [
      "/share-canvas",
      "/share-screen-dialog",
      "/room-member-list",
    ];

    paths.forEach((path) => {
      navigation.close(path);
    });

    state.shareStream = undefined;

    state.isScreenShareEnabled = false;

    meetingStore.isScreenShareEnabled = false;
  };

  const leaveMeeting = async () => {
    const loading = ElLoading.service({ fullscreen: true });
    const isRepeatedMeeting =
      repeatType.value === MeetingRepeatType.None ||
      appointmentType.value === MeetingAppointmentType.Quick;
    try {
      await stopAllSelfTransfers();

      const isLast = !Array.from(room.value.participants?.values()).some(
        (item) => item.identity.length !== 36,
      );

      isLast && (await updateRecording());

      await outMeetingApi({
        meetingId: meetingId.value,
        meetingSubId: isRepeatedMeeting ? undefined : meetingSubId.value,
      });
    } finally {
      appStore.isMeeting = false;
      room.value?.disconnect();
      loading.close();
      navigation.destroy("/room");
    }
  };

  const endMeeting = async () => {
    const loading = ElLoading.service({ fullscreen: true });
    // 主持人发送DataChannel通知其他人结束会议
    publishData<DataChannelNotify>({
      command: DataChannelCommand.Notify,
      message: {
        type: DataChannelNotifyType.EndMeeting,
      },
    });
    try {
      await stopAllSelfTransfers();

      //结束会议要先调这个接口才有历史会议
      await endMeetingApi({
        meetingNumber: meetingQuery?.meetingNumber,
      });
    } finally {
      if (recordingState.isRecording) {
        await updateRecording();
      }
      appStore.isMeeting = false;
      room.value?.disconnect();
      scheduleStore.updateItemStatus(meetingId.value, MeetingStatus.Completed);
      loading.close();
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
      },
    });
  };
  const recordSpeak = async () => {
    if (recordingState.isRecording) {
      if (!meetingQuery.isMuted) {
        speakRecordState.trackId =
          room.value?.localParticipant.getTrack(Track.Source.Microphone)
            ?.trackSid || "";
        const request = {
          meetingNumber: speakRecordState.meetingNumber,
          meetingRecordId: recordingState.meetingRecordId,
          trackId: speakRecordState.trackId,
          speakStartTime: Date.now(),
        };
        const { data, code, msg } = await recordSpeakApi(request);
        if (code === 200) {
          speakRecordState.id = data?.id;
          speakRecordState.speakStartTime = data?.speakStartTime;
        }
      } else {
        speakRecordState.trackId =
          room.value?.localParticipant.getTrack(Track.Source.Microphone)
            ?.trackSid || "";
        const request = {
          id: speakRecordState.id,
          meetingNumber: speakRecordState.meetingNumber,
          meetingRecordId: recordingState.meetingRecordId,
          trackId: speakRecordState.trackId,
          speakStartTime: speakRecordState.speakStartTime,
          speakEndTime: Date.now(),
        };
        await recordSpeakApi(request);
      }
    }
  };

  const speakRecord = async (record: boolean) => {
    if (!recordingState?.isRecording) return;

    speakRecordApi({
      meetingNumber: speakRecordState.meetingNumber,
      record,
    }).catch((err) => {
      console.log(err);
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

    switch (params.type) {
      case MemberListEventEnum.ChangeName:
        if (room.value?.localParticipant?.sid === kicSid) {
          room.value?.localParticipant.setName(data?.name);
        } else {
          publishData(
            {
              command: DataChannelCommand.SetName,
              message: {
                name: data?.name,
              },
            },
            [kicSid],
          );
        }
        break;
      case MemberListEventEnum.Mute:
        if (room.value?.localParticipant?.sid === kicSid) {
          updateMicMuteStatus(data?.isMuted);
        } else {
          publishData(
            {
              command: DataChannelCommand.SetSilent,
              message: {
                isSilent: data?.isMuted,
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
            message: {},
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
    beforeStartShare(() => navigation.navigate("/share-screen-dialog"));
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
      await room.value?.localParticipant?.setMicrophoneEnabled(false, {
        deviceId: val,
        echoCancellation: true,
        noiseSuppression: true,
      });

      room.value?.localParticipant &&
        handleParticipant(room.value?.localParticipant);
    },
  );

  onMounted(() => {
    window.store.subscribe(async (key, value) => {
      switch (key) {
        case StoreEventEnum.ShareScreen:
          beforeStartShare(async () => {
            state.isScreenShareEnabled && (await stopShare());

            nextTick(async () => {
              const { id, displayId, isShareAudio } = JSON.parse(value) as any;

              state.isScreenShareEnabled = true;

              await startShare({ id, displayId }, false);

              navigation.navigate("/share-canvas");
            });
          });
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
          sendDrawing(JSON.parse(value));

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

  return {
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
