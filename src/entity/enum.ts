export enum MeetingStreamMode {
  MCU,
  SFU,
}

export enum StreamType {
  Video,
  ShareScreen,
}

export enum DrawingTool {
  Cursor, // 光标
  Move, // 选择
  Laser, // 激光笔
  Brush, // 画笔
  Text, // 文本
  Graphical, // 图形
  Eraser, // 橡皮擦
  Undo, // 撤销
  Redo, // 重做
  Clear, // 清空
  Save, // 保存
  Init,
}

// rtc的data channel 发送的命令
export enum DataChannelCommand {
  Notify = "notify", // 通知 例：主持人结束会议通知
  Drawing = "drawing", // 画板消息
  Message = "message", // IM消息
  EchoAvatar = "echoAvatar",
  KicOutUser = "kicOutUser", //被踢的参会人
  Recording = "recording", // 录制
  /**
   * 用户管理
   */
  MemberManagement = "MemberManagement",
  /**
   *  安全
   */
  UpdateSecure = "UpdateSecure",
  /**
   * 自定义 IM SDK群提示消息
   */
  MSG_GRP_TIP = "MSG_GRP_TIP",
}

// 自定义 IM SDK 群提示消息操作类型
export enum MsgGrpTip {
  /**
   * 有成员加群
   */
  GRP_TIP_MBR_JOIN = "GRP_TIP_MBR_JOIN",
  /**
   * 有群成员退群
   */
  GRP_TIP_MBR_QUIT = "GRP_TIP_MBR_QUIT",
  /**
   * 有群成员被踢出群
   */
  GRP_TIP_MBR_KICKED_OUT = "GRP_TIP_MBR_KICKED_OUT",
  /**
   * 群组资料变更
   */
  GRP_TIP_GRP_PROFILE_UPDATED = "GRP_TIP_GRP_PROFILE_UPDATED",
}

export interface IMsgGrpTipMessageProps {
  type: MsgGrpTip;
  sid: string;
}

export enum EchoAvatarType {
  GetList,
  SwitchEA,
}

export enum DataChannelNotifyType {
  Connect = "Connect",
  EndMeeting = "EndMeeting",
}

// 绘制过程
export enum DrawingStep {
  Start,
  Process,
  End,
}

// IM消息类型
export enum MessageType {
  Message,
  Picture,
}

// IM消息发送类型
export enum MessageSendStatus {
  Success,
  Sending,
  Fail,
}

// 智能转换
export enum SpeechTargetLanguageType {
  // 粤语
  Cantonese = 11,

  // 普通话
  Mandarin = 12,

  // 英语
  English = 13,

  // 日本语
  Japanese = 14,

  // 韩语
  Korean = 15,

  // 西班牙语
  Spanish = 16,

  // 法语
  French = 17,
}

export enum EchoAvatarLanguageType {
  // 粤语
  Cantonese = 0,

  // 普通话
  Mandarin = 1,

  // 英语
  English = 2,

  // 韩语
  Korean = 3,

  // 西班牙语
  Spanish = 4,
}

export enum VoiceSamplesByLanguageType {
  // 粤语
  Cantonese = 113,

  // 普通话
  Mandarin = 120,

  // 英语
  English = 130,

  // 西班牙语
  Spanish = 160,
}

export enum SpeechStatus {
  // 未读
  UnViewed,

  // 已读
  Viewed,

  // 已撤回
  Cancelled,
}
export enum MeetingAppointmentType {
  //预约会议
  Appointment,
  //快速会议
  Quick,
}

export enum MeetingRepeatType {
  //不重复
  None,
  //每天
  Daily,
  //每个工作日
  EveryWeekday,
  //每周
  Weekly,
  //每两周
  BiWeekly,
  //每月
  Monthly,
  //自定義
  Customize,
}

export enum MeetingStatus {
  //待开始
  Pending,
  //进行中
  InProgress,
  //已结束
  Completed,
  //已取消
  Cancelled,
}

export enum FileTranscriptionStatus {
  Pending = 10,
  InProgress = 20,
  Completed = 30,
  Exception = 40,
}
export enum MeetingRecordUriStatus {
  Pending,
  InProgress,
  Completed,
  Failed,
}
export enum GenerationStatus {
  Pending = 10,
  InProgress = 20,
  Completed = 30,
}

// 屏幕等级
export enum WindowsLevelEnum {
  Normal = "normal",
  Floating = "floating",
  TornOffMenu = "torn-off-menu",
  ModalPanel = "modal-panel",
  MainMenu = "main-menu",
  StatusBar = "status",
  PopUpMenu = "pop-up-menu",
  ScreenSaver = "screen-saver",
}

export enum StoreEventEnum {
  ReserveShareCanvasMouse,
  IgnoreShareCanvasMouse,
  UpdateMeetingParticipants,
  UpdateMeetingPermission,
  UpdateDrawingBoard,
  OpenDrawingTool,
  LeaveMeeting,
  MemberListDataReceived,
  ShareScreen,
  UpdateModerator,
  SendDrawing,
  UpdateMeetingSecure,
  WhiteboardSyncData,
  WhiteboardSendMessage,
  WhiteboardReady,
  WhiteboardSendError,
  WhiteboardSendAddAckData,
  EndSharing,
  RoomPageReady,
  WhiteboardHistoryData,
}
