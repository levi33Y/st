import { ScreenRecordingResolutionEnum } from "@/services/apis/trtc/types";
import {
  MeetingRepeatType,
  MeetingStatus,
  MeetingStreamMode,
  SpeechTargetLanguageType,
  StreamType,
} from "../../../entity/enum";
import {
  Meeting,
  MeetingUserSettings,
  userBasicInfo,
  UserSession,
} from "../../../entity/response";

export enum SummaryStatusEnum {
  Pending = 10,

  InProgress = 20,

  Completed = 30,
}

export enum MeetingTimeZoneEnum {
  America = "America/Los_Angeles",
  Asia = "Asia/Shanghai",
}

export enum MeetingLanguageEnum {
  ZH,
  EN,
  ES,
  KO,
}

interface Response {
  dataId: number;
  errorId: number;
  message: string;
  success: boolean;
}

export interface JoinMeetingRequest {
  meetingNumber: string;
  isMuted: boolean;
  streamId?: string;
  streamType?: StreamType;
  isLiveKit?: boolean;
  securityCode?: string;
}

export interface JoinMeetingResponse {
  userId: number;
  userName: string;
  isEntryWaitingRoom: boolean;
  meeting: Meeting;
  meetingUserSetting: MeetingUserSettings;
  response: Response;
  taskId?: string;
  recordingResolution: ScreenRecordingResolutionEnum;
}

export interface ICreateMeetingRequestParticipantsProps {
  thirdPartyUserId: string;
  isDesignatedHost: boolean;
}

export enum CustomFrequencyTypeEnum {
  Weekly,
  Daily,
  Monthly,
}

export interface CreateMeetingRequest {
  meetingStreamMode?: MeetingStreamMode;
  startDate: Date | string;
  endDate: Date | string;
  isLiveKit?: boolean;
  title?: String;
  timeZone?: String;
  securityCode?: String;
  utilDate?: Date | null;
  repeatType?: MeetingRepeatType;
  appointmentType?: Number;
  participants: ICreateMeetingRequestParticipantsProps[];
  isMetis: boolean;
  isMuted?: boolean;
  isRecorded?: boolean;
  customizeRepeatType?: CustomFrequencyTypeEnum;
  repeatInterval?: number;
  repeatWeekdays?: number[];
  repeatMonthDays?: number[];
}
export interface EditMeetingResponse extends CreateMeetingRequest {
  id: string;
}

export interface CreateMeetingResponse extends Meeting {}

export interface GetMeetingInfoRequest {
  meetingNumber: string;
  includeUserSession?: boolean;
}

export interface IGetMeetingInfParticipantsProps
  extends ICreateMeetingRequestParticipantsProps {
  userName: string;
  url: string;
}

export interface GetMeetingInfoResponse extends Meeting {
  isPasswordEnabled: boolean;
  isRecorded: boolean;
  repeatType: number;
  timeZone: MeetingTimeZoneEnum;
  title: string;
  appointmentType: number;
  participants: IGetMeetingInfParticipantsProps[];
  status: MeetingStatus;
  createdBy: number;
  securityCode: string;
  customizeRepeatType?: CustomFrequencyTypeEnum;
  repeatInterval?: number;
  repeatWeekdays: number[];
  repeatMonthDays: number[];
  utilDate?: string;
}

export interface OutMeetingRequest {
  meetingId: string;
  meetingSubId: string | undefined;
}

export interface EndMeetingRequest {
  meetingNumber: string;
}

export interface AudioChangeRequest {
  meetingUserSessionId: number;
  streamId: string;
  isMuted: boolean;
}

export interface AudioChangeResponse {
  response: Response;
  meetingUserSession: UserSession[];
}

export interface ScreenShareRequest {
  meetingUserSessionId: number;
  streamId: string;
  isShared: boolean;
}

export interface ScreenShareResponse {
  response: Response;
  meetingUserSession: UserSession[];
}

export interface SaveAudioRequest {
  meetingId: string;
  audioForBase64: string;
}

export interface UpdateMeetingUserSettingsRequest {
  targetLanguageType: SpeechTargetLanguageType;
}

export interface RecordSpeakRequest {
  id?: string | undefined;
  meetingNumber: string;
  meetingRecordId: string;
  trackId: string;
  speakStartTime: number | undefined;
  speakEndTime?: number | undefined;
}

export interface ISpeakRecordRequestProps {
  meetingNumber: string;
  record: boolean;
}

export interface startRecordingResponse {
  code: number;
  msg: string;
  meetingRecordId: string;
  egressId: string;
}
export interface StopRecordingRequest {
  meetingId: string;
  meetingRecordId: string;
  egressId: string;
}

export interface RecordListResponse {
  code: number;
  data: RecordListDetailData;
  msg: string;
}
export interface RecordListDetailData {
  count: number;
  records: RecordList[];
}
export interface RecordList {
  meetingId: string;
  meetingRecordId: string;
  meetingNumber: string;
  recordNumber: string;
  title: string;
  startDate: number;
  endDate: number;
  duration: number;
  timezone: string;
  meetingCreator: string;
  url: string;
}

export interface RecordListTable extends RecordList {
  startTime: string;
  endTime: string;
  formattedDuration: string;
}

export interface RecordDetailResponse {
  id: string;
  meetingTitle: string;
  meetingNumber: string;
  meetingStartDate: number;
  meetingEndDate: number;
  url: string;
  meetingRecordDetails: MeetingRecordDetail[];
  summary: Summary;
}
export interface MeetingRecordDetail {
  id: number;
  meetingNumber: string;
  meetingRecordId: string;
  trackId: string;
  userId: number;
  username: string;
  speakStartTime: number;
  speakEndTime: number;
  speakStatus: number;
  originalContent: string;
  smartContent: string;
  originalTranslationContent: string;
  smartTranslationContent: string;
  fileTranscriptionStatus: number;
  translationStatus: number;
  createdDate: string;
}
export interface InviteMessage {
  sender: string;
  title: string;
  meetingNumber: string;
  url: string;
  password: string;
}

export interface IsMeetingMaster {
  isMeetingMaster: boolean;
}
export interface RecordListRequest {
  "PageSetting.Page": number;
  "PageSetting.PageSize": number;
  keyword?: string;
  meetingTitle?: string;
  meetingNumber?: string;
  creator?: string;
}
export interface SummaryRequest {
  meetingRecordId: string;
  meetingNumber: string;
  language: number | undefined;
  speakInfos: SummarySpeakInfo[];
}
export interface SummarySpeakInfo {
  id: number;
  userName: string;
  speakContent: string;
  speakTime: number;
}

export interface SummaryResponse {
  id: number;
  recordId: string;
  meetingNumber: string;
  speakIds: string;
  originText: string;
  summary: Summary;
  targetLanguage: number;
  status: number;
  createdDate: string;
}

export interface ISummaryDtoAbstractrPops {
  abstract_title: string;
  abstract_content: string;
}

export interface ISummaryDtoProps {
  meeting_summary: string;
  meeting_todo: string;
  abstract: ISummaryDtoAbstractrPops[];
  meeting_todo_items: { meeting_todo_item: string }[];
}

export interface Summary {
  id: number;
  recordId: string;
  meetingNumber: string;
  speakIds: string;
  originText: string;
  summary: string;
  targetLanguage: MeetingLanguageEnum;
  status: SummaryStatusEnum;
  createdDate: string;
  summaryDto: ISummaryDtoProps;
}

export interface SaveToneRequest {
  meetingId: string;
  voiceId?: string;
  isSystem: boolean;
  voiceName?: string;
  speed?: number;
  transpose?: number;
  style?: number;
  inferenceRecordId?: number;
  selfLanguage: number;
  listeningLanguage: number;
}

export interface IStaffsStaffDepartmentHierarchyProps {
  department: {
    id: string;
    name: string;
    parentId: string;
  };
  staffs: {
    id: string;
    userName: string;
    url?: string;
  }[];
  childrens: IStaffsStaffDepartmentHierarchyProps[];
}

export interface IStaffsRequestProps {
  staffDepartmentHierarchy: IStaffsStaffDepartmentHierarchyProps[];
}

// 权限相关
export enum MeetingPermissionEnum {
  CoHost = 10, // 联席主持人
  Host = 20, // 主持人
}

export interface UpdateRoleRequest {
  meetingId: string;
  userId: string;
  newRole: MeetingPermissionEnum;
  isCoHost: boolean | null;
}

export interface IWaitingRoomUserSessionsProps extends userBasicInfo {}

export interface INoJoinMeetingUsersProps {
  id: string;
  userName: string;
  invitationStatus: InvitationStatusEnum;
  url?: string;
}

export interface GetAllInfoResponse {
  count: number;
  meetingUserSessions: IMeetingUserSessionsProps[];
  waitingRoomUserSessions: IWaitingRoomUserSessionsProps[];
  noJoinMeetingUsers: INoJoinMeetingUsersProps[];
}

export interface IMeetingUserSessionsProps extends userBasicInfo {}

export interface IMeetingLockRequestProps {
  meetingId: string;
  isLocked?: boolean;
  isOpenWaitingRoom?: boolean;
}

// 转为必填
export interface IMeetingLockResponseProps
  extends Required<IMeetingLockRequestProps> {}

export enum OnlineTypeEnum {
  Online = 0,
  OutMeeting,
  KickOutMeeting,
  TimeOutMeeting,
  Waiting = 4,
}

export interface IUpdateMeetingTypeRequest {
  ids: number[];
  onlineType?: OnlineTypeEnum;
  allowEntryMeeting?: boolean;
}

export enum IInviteMeetingStaffStatusEnum {
  InMeeting,
  NotJoined,
}

export interface IInviteStaffsStaffDepartmentHierarchyProps {
  department: {
    id: string;
    name: string;
    parentId: string;
  };
  staffs: {
    id: string;
    userName: string;
    meetingStaffStatus: IInviteMeetingStaffStatusEnum;
    url?: string;
  }[];
  childrens: IInviteStaffsStaffDepartmentHierarchyProps[];
}

export interface IInviteUsersResponseProps {
  staffDepartmentHierarchy: IInviteStaffsStaffDepartmentHierarchyProps[];
}

export interface IInviteCreateRequestProps {
  meetingId: string;
  meetingSubId: string;
  names: string[];
}

export enum InvitationStatusEnum {
  /**
   * 等待中
   */
  InvitationPending,
  /**
   * 在会议中
   */
  InCall,
  /**
   * 被邀请过
   */
  Invited,
  /**
   * 同意
   */
  Accepted,
  /**
   * 拒绝
   */
  Declined,
}

export const InvitationStatusTextConst = {
  [InvitationStatusEnum.InvitationPending]: "呼叫中",
  [InvitationStatusEnum.InCall]: "通話中",
  [InvitationStatusEnum.Invited]: "未接聽",
  [InvitationStatusEnum.Accepted]: "加入中",
  [InvitationStatusEnum.Declined]: "已拒絕",
};

export interface IInviteCreateResponseProps {
  id: number;
  meetingId: string;
  meetingSubId: string;
  userId: number;
  userName: string;
  beInviterUserId: number;
  invitationStatus: InvitationStatusEnum;
  createdDate: string;
}

export interface IMeetingInvitationRecordsProps {
  id: number;
  invitationStatus: InvitationStatusEnum;
}

export interface IInviteUpdateRequestProps {
  meetingInvitationRecords: IMeetingInvitationRecordsProps[];
}
export interface IInviteRecordsResponseProps {
  id: number;
  meetingId: string;
  meetingSubId: string;
  invitingPeople: string;
  meetingTitle: string;
}

export interface IRecordCutRequestProps {
  meetingName: string;
  title: string;
  url: string;
  recordId: string;
  meetingId: string;
  times: {
    startTime: number;
    endTime: number;
  }[];
}

export interface IRecordCutResponseProps {
  meetingRecordId: string;
  meetingId: string;
  meetingNumber: string;
  recordNumber: string;
  title: string;
  startDate: number;
  endDate: number;
  duration: number;
  timezone: string;
  meetingCreator: string;
  url: string;
  urlStatus: number;
}
