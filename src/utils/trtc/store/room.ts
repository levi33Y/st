import { MeetingAppointmentType, MeetingRepeatType } from "@/entity/enum";
import { OnlineTypeEnum } from "@/entity/response";
import { InvitationStatusEnum } from "@/services/apis/meeting/types";
import { isEmpty, isNil } from "lodash";
import { defineStore } from "pinia";
import { TRTCScreenCaptureSourceInfo } from "trtc-electron-sdk";

export enum UserRoleEnum {
  CoHost = 10, // 联席主持人
  Host = 20, // 主持人
  Participant, // 普通参会人
}

export interface IUserInfoProps {
  id: string;
  name: string;
  /** server assigned unique id */
  sid: string;
  nick: string;
  isMuted: boolean;
  outputAudioLevel: number;
  screenShareStream: MediaStream | null;
  cameraStream: MediaStream | null;
  isLocal: boolean;
  role: UserRoleEnum;
  status: OnlineTypeEnum;
  invitationStatus?: InvitationStatusEnum;
  avatarUrl?: string;
}

export interface IRecordingInfoProps {
  taskId: string;
  meetingRecordId: string;
  speakId: string;
  speakStartTime: number;
  isRecording: boolean;
}

export interface IMeetingInfoProps {
  meetingNumber: string;
  meetingId: string;
  meetingSubId: string;
  meetingTitle: string;
  repeatType: MeetingRepeatType;
  appointmentType: MeetingAppointmentType;
  creatorId: string;
  creatorName: string;
}

export interface ISecurityProps {
  isLockEnabled: boolean;
  isWaitingRoomEnabled: boolean;
}

export interface IMeetingSettingInfoProps {
  isMute: boolean;
  isRecorded: boolean;
  isWaitingRoomEnabled: boolean;
  isMetis: boolean;
  isSetPassword: boolean;
  // waitingRoom
  microphoneEnable?: boolean;
  cameraEnable?: boolean;
}

export interface IApplicationSettingInfoProps {
  microphoneEnable: boolean;
  cameraEnable: boolean;
  showMeetingDuration: boolean;
  microphoneDevice: string;
  speakerDevice: string;
}

interface IRoomStoreProps {
  localUserInfo: IUserInfoProps;
  userInfo: Record<string, IUserInfoProps>;
  meetingInfo: IMeetingInfoProps;
  recordingInfo: IRecordingInfoProps;
  moderatorInfo: IUserInfoProps;
  securityInfo: ISecurityProps;
  shareWindowInfo: TRTCScreenCaptureSourceInfo | null;
  meetingSettingInfo: IMeetingSettingInfoProps;
  applicationSettingInfo: IApplicationSettingInfoProps;
  speakList: string[];
  onJoinUsers: Partial<IUserInfoProps>[];
}

export const useRoomStore = defineStore("roomStore", {
  state: (): IRoomStoreProps => ({
    localUserInfo: {} as IUserInfoProps,
    userInfo: {} as Record<IUserInfoProps["sid"], IUserInfoProps>,
    recordingInfo: {} as IRecordingInfoProps,
    meetingInfo: {} as IMeetingInfoProps,
    moderatorInfo: {} as IUserInfoProps,
    securityInfo: {} as ISecurityProps,
    meetingSettingInfo: {} as IMeetingSettingInfoProps,
    applicationSettingInfo: {} as IApplicationSettingInfoProps,
    speakList: [],
    onJoinUsers: [],
    shareWindowInfo: null,
  }),
  actions: {
    insertUserInfo(userInfo: IUserInfoProps, isLocal: boolean = false) {
      if (isLocal) {
        this.localUserInfo = {
          ...userInfo,
          isLocal: true,
        };
      }

      this.userInfo[userInfo.sid] = {
        ...userInfo,
        isLocal,
      };
    },
    removeUserInfo(sid: string) {
      delete this.userInfo[sid];
    },
    updateUserInfo(userInfo: IUserInfoProps) {
      userInfo.sid &&
        (this.userInfo[userInfo.sid] = {
          ...this.userInfo[userInfo.sid],
          ...userInfo,
        });
    },
    updateLocalUserInfo(userInfo: Partial<IUserInfoProps>) {
      const info = {
        ...this.localUser,
        ...userInfo,
        isLocal: true,
      };

      if (!info.sid) {
        console.warn("updateLocalUserInfo sid is empty");

        return;
      }

      this.localUserInfo = info;

      this.userInfo[info.sid] = info;
    },
    getUserInfoBySid(sid: string) {
      return this.userInfo[sid];
    },
    getUserInfoById(id: string) {
      return this.userList.find((item) => item.id == id);
    },
    updateSpeakList(speakList: string[]) {
      this.speakList = speakList;
    },
    updateRecordInfo(info: Partial<IRecordingInfoProps>) {
      this.recordingInfo = {
        ...this.recordingInfo,
        ...info,
      };
    },
    updateNoJoinUsers(users: Partial<IUserInfoProps>[]) {
      this.onJoinUsers = users;
    },
    updateMeetingInfo(info: IMeetingInfoProps) {
      this.meetingInfo = {
        ...this.meetingInfo,
        ...info,
      };
    },
    updateSecurityInfo(info: ISecurityProps) {
      this.securityInfo = {
        ...this.securityInfo,
        ...info,
      };
    },
    updateShareWindowInfo(info: TRTCScreenCaptureSourceInfo) {
      this.shareWindowInfo = info;
    },
    updateMeetingSettingInfo(info: Partial<IMeetingSettingInfoProps>) {
      this.meetingSettingInfo = {
        ...this.meetingSettingInfo,
        ...info,
      };
    },
    updateApplicationSettingInfo(info: IApplicationSettingInfoProps) {
      this.applicationSettingInfo = this.applicationSettingInfo;
    },
  },
  getters: {
    userList(state) {
      return Object.values(state.userInfo);
    },
    onlineUser(state): IUserInfoProps[] {
      const list = this.userList.filter(
        (item) => item.status == OnlineTypeEnum.Online,
      );

      return list;
    },
    roomUserIdList(): string[] {
      const list =
        this.userList
          ?.filter((item) =>
            [OnlineTypeEnum.Online, OnlineTypeEnum.Waiting].includes(
              item.status,
            ),
          )
          ?.map((item) => item.id) ?? [];

      return list;
    },
    roomUserListSize(): number {
      const size =
        this.userList.filter((item) =>
          [OnlineTypeEnum.Online, OnlineTypeEnum.Waiting].includes(item.status),
        )?.length ?? 0;

      return size;
    },
    onlineUserList(state) {
      return Object.values(state.userInfo)?.filter(
        (item) => item.status === OnlineTypeEnum.Online,
      );
    },
    meeting(state) {
      return state.meetingInfo;
    },
    localUser(state): IUserInfoProps {
      return state.userInfo?.[state.localUserInfo.sid];
    },
    screenStream(state): MediaStream | null {
      return (
        this.userList.find((user) => !isNil(user.screenShareStream))
          ?.screenShareStream ?? null
      );
    },
    shareScreenUser(state): IUserInfoProps | null {
      const user = this.userList.find((user) => !isNil(user.screenShareStream));

      return user ? user : null;
    },
    cameraStreamUser(state): IUserInfoProps[] {
      return this.userList?.filter((user) => !isNil(user.cameraStream)) ?? [];
    },
    recordState(state) {
      return {
        meetingNumber: state.meetingInfo.meetingNumber,
        ...state.recordingInfo,
      };
    },
    isRecording(state) {
      return (
        !isNil(state.recordingInfo.taskId) &&
        !isEmpty(state.recordingInfo.taskId)
      );
    },
    isMuted(state): boolean {
      return this.localUser?.isMuted ?? true;
    },
    isCameraEnable(state): boolean {
      return !isNil(this.localUser?.cameraStream);
    },
    waitRoomList(state) {
      return [];
    },
    isCreator(state) {
      return state.meetingInfo.creatorId === state.localUserInfo.id;
    },
    isModerator(stare): boolean {
      return this.localUser?.role === UserRoleEnum.Host;
    },
    isHasHost(stare): boolean {
      return (
        this.localUser?.role === UserRoleEnum.CoHost ||
        this.localUser?.role === UserRoleEnum.Host
      );
    },
    isLockEnable(state) {
      return state.securityInfo?.isLockEnabled;
    },
    isWaitingRoomEnabled(state) {
      return state.securityInfo?.isWaitingRoomEnabled;
    },
    captureSources(state) {
      return state.shareWindowInfo;
    },
    isRepeatedMeeting(state) {
      return (
        state.meetingInfo.repeatType === MeetingRepeatType.None ||
        state.meetingInfo.appointmentType === MeetingAppointmentType.Quick
      );
    },
    meetingSetting(state) {
      return state.meetingSettingInfo;
    },
  },
});
