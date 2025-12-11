import {
  MeetingRepeatType,
  SpeechTargetLanguageType,
  StreamType,
} from "./enum";

export interface ResponseResult<T> {
  code: number;
  data: T;
  msg: string;
}

export interface LoginResponse {
  ".expires": string;
  ".issued": string;
  access_token: string;
  expires_in: number;
  token_type: string;
  userName: string;
}

export interface UserSessionStream {
  id: string;
  streamId: string;
  meetingUserSessionId: string;
  streamType: StreamType;
}

export enum OnlineTypeEnum {
  /**
   * 在线
   */
  Online,
  /**
   * 正常退出
   */
  OutMeeting,
  /**
   * 被踢出
   */
  KickOutMeeting,
  /**
   * 超时退出
   */
  TimeOutMeeting,
  /**
   * 等待中
   */
  Waiting,
  /**
   * 在线
   */
  NotJoined,
  /**
   * 在线
   */
  NotAnswered,
  /**
   * 在线
   */
  InCall,
  /**
   * 在线
   */
  Calling,
  /**
   * 在线
   */
  Rejected,
}

export interface userBasicInfo {
  id: number;
  createdDate: string;
  meetingId: string;
  userId: number;
  userName: string;
  guestName: string | null;
  isMuted: boolean;
  isSharingScreen: boolean;
  isMeetingMaster: boolean; // 是否为主持人
  onlineType: OnlineTypeEnum;
  meetingSubId: string | null;
  lastJoinTime: number;
  coHost?: boolean; // 是否为联席主持人
  lastModifiedDateForCoHost?: string;
  isMeetingCreator?: boolean; // 是否为会议创建人
  /**
   * 自动准入
   */
  allowEntryMeeting: boolean;
  /**
   * 头像
   */
  url?: string;
}

export interface UserSession extends userBasicInfo {
  streamId: string;
  userSessionStreams: UserSessionStream[];
}

export interface IUserSessionProps extends userBasicInfo {}

export interface Meeting {
  id: string;
  startDate: number;
  endDate: number;
  meetingMasterUserId: number;
  meetingNumber: string;
  meetingRecordId: string;
  meetingStreamMode: number;
  mergedStream: string;
  originAdress: string;
  token?: string;
  repeatType: MeetingRepeatType;
  appointmentType: number;
  meetingSubId: string;
  // 入会是否开启录制
  isRecorded: boolean;
  isActiveEa: boolean;
  // 会议是否录制中
  isActiveRecord: boolean;
  title: string;
  password: string;
  isPasswordEnabled: boolean;
  isMetis: boolean;
  isLocked: boolean;
  isWaitingRoomEnabled: boolean;
  isMuted?: boolean;
  userSessions?: IUserSessionProps[];
  createdBy?: number;
}

export interface MeetingUserSettings {
  id: string;
  userId: number;
  targetLanguageType: SpeechTargetLanguageType;
}

export interface UserInfo {
  createdOn: string;
  id: number;
  isActive: boolean;
  issuer: number;
  modifiedOn: string;
  roles: any[];
  thirdPartyUserId: string;
  userName: string;
  uuid: string;
  url?: string;
}
