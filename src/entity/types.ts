import { MeetingTimeZoneEnum } from "../services/apis/meeting/types";
import {
  DataChannelCommand,
  DataChannelNotifyType,
  DrawingStep,
  DrawingTool,
  MeetingRepeatType,
  MeetingStreamMode,
  MessageSendStatus,
  MessageType,
  SpeechStatus,
  SpeechTargetLanguageType,
} from "./enum";

export type RoutePath =
  | "/home"
  | "/settings"
  | "/feedback-list"
  | "/join-meeting"
  | "/schedule-meeting"
  | "/history-meeting"
  | "/history-meeting-detail"
  | "/history-meeting-participant"
  | "/intelligent-list"
  | "/intelligent-detail"
  | "/meeting"
  | "/room"
  | "/invite"
  | `/screen-name/${number}`
  | "/screen-border"
  | "/schedule-meeting-detail"
  | "/meeting-member"
  | "/schedule-meeting-participant"
  | "/schedule-meeting-host"
  | "/schedule-meeting-setting"
  | "/share-canvas"
  | "/share-screen-dialog"
  | "/room-member-list"
  | "/room-leave-dialog"
  | "/version-update"
  | "/schedule-meeting-cycle"
  | "/meeting-dropdown-menu"
  | "/rtrc"
  | "/security-dropdown-menu"
  | "/function-dropdown-menu"
  | "/trtc-room"
  | "/trtc-room-member"
  | "/trtc-screen-canvas"
  | "/trtc-screen-dialog"
  | "/meeting-schedule-notice"
  | "/meeting-invitation-notice"
  | "/invite-user-dialog"
  | "/meeting-invitation-confirm"
  | "/invite-dropdown-menu";

export interface ScreenSource {
  appIcon: Base64URLString;
  display_id: string;
  id: string;
  name: string;
  thumbnail: string;
}

export interface StreamItem {
  stream: MediaStream;
  track: MediaStreamTrack;
  streamId: string;
  trackId: string;
}

export interface MeetingQuery {
  autoAudio: boolean;
  isMuted: boolean;
  enableCamera: boolean;
  meetingNumber: string;
  userName: string;
  meetingStreamMode: MeetingStreamMode;
  securityCode?: string;
}
export interface MeetingDetailQuery {
  title: string;
  detailDate: string;
  detailNumber: string;
  detailFounder: string;
  detailUsers: string[];
  detailTime: string;
  detailRecord: string;
  meetingId: string;
  id: string;
  userId: number;
  timeZone: string | null;
  isAppointment: boolean;
}

export interface StreamInfo {
  maxTrackCount: number;
  room: string;
  streamId: string;
  streamList: string;
  streams: string[];
}

export interface DataChannel {
  eventType: string;
  streamId: string;
}

export interface AppInfo {
  name: string;
  version: string;
  platform: "mac" | "win" | "other";
}

export interface Point {
  x: number;
  y: number;
}

export interface DataChannelMessage<T> {
  command: DataChannelCommand;
  message: T;
}

export interface DataChannelNotify {
  type: DataChannelNotifyType;
}

// 绘制Item
export interface DrawingRecord {
  id: string;
  userId: number;
  tool: DrawingTool;
  drawingTool?: DrawingTool;
  size: number;
  color: string;
  points: Point[];
  step: DrawingStep;
  fabric?: fabric.Object;
}

// 共享屏幕的video 尺寸信息
export interface VideoSizeInfo {
  width: number;
  height: number;
  videoWidth: number;
  videoHeight: number;
  currentVideoWidth: number;
  currentVideoHeight: number;
  ratio: number;
}

// IM Message
export interface Message {
  id: string;
  type: MessageType;
  content: string;
  fileType: string;
  filePath: string;
  size: number;
  sendStatus: MessageSendStatus;
  sendTime: string;
  isReaded: boolean;
  sendByUserId: number;
  sendByUserName: string;
  sendToUserId: number;
  sendToUserName: string;
}

export interface MeetingSpeech {
  id: string;
  meetingId: string;
  userId: number;
  userName: string;
  voiceUrl: string;
  originalText: string;
  translatedText: string;
  createdDate: string;
  status: SpeechStatus;
  voiceRecord: VoiceRecordData;
}
export interface VoiceRecordData {
  id: string;
  voiceLanguage: number;
  createdDate: string;
  speechId: string;
  voiceId: string;
  isSystemVoice: boolean;
  voiceUrl: string;
  isSelf: boolean;
  generationStatus: number;
  translatedText: string;
}
export interface MeetingSettings {
  id: string;
  userId: number;
  listenedLanguageType: SpeechTargetLanguageType;
  targetLanguageType: SpeechTargetLanguageType;
}

export interface MeetingAppointment {
  code: number;
  msg: string;
  data: MeetingAppointmentData;
}
export interface MeetingAppointmentData {
  count: number;
  records: MeetingAppointmentRecord[];
}
export interface MeetingAppointmentRecord {
  meetingId: string;
  meetingNumber: string;
  title: string;
  appointmentType: number;
  startDate: number;
  endDate: number;
  status: number;
  timeZone: MeetingTimeZoneEnum;
  yearDate?: string;
  durationTime?: string;
  repeatType?: MeetingRepeatType;
}
export interface MeetingHistoryList {
  code: number;
  msg: string;
  meetingHistoryList: MeetingHistoryListData[];
  totalCount: number;
}

export interface IHistoryAttendeesProps {
  id: number;
  userName?: string;
  isHost?: boolean;
  url?: string;
}

export interface MeetingHistoryListData {
  id: string;
  meetingId: string;
  meetingSubId: string;
  userId: number;
  meetingNumber: string;
  title: string;
  startDate: number;
  endDate: number;
  duration: number;
  timeZone: MeetingTimeZoneEnum;
  meetingCreator: string;
  attendees: IHistoryAttendeesProps[];
  attendeesCount: number;
  appointmentType: number;
}

export interface RecordSpeak {
  id?: string | undefined;
  meetingNumber: string;
  meetingRecordId: string;
  trackId: string;
  speakStartTime: number | undefined;
  speakEndTime?: number | undefined;
}
