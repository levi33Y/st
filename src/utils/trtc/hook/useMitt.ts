import { ITencentKeyResponseProps } from "@/services/apis/trtc/types";

export enum TRTCSDKEnum {
  INIT = "event-sdk-init",
  Ready = "event-sdk-ready",
}

export enum MeetingEventEnum {
  SecureEvent = "event-sdk-secure",
  RecordEvent = "record-event",
  MemberManagerEvent = "member-manager-event",
  StopShare = "StopShare",
  LeaveMeeting = "LeaveMeeting",
  MeetingEnded = "EndMeeting",
  KickOutMeeting = "KickOutMeeting",
}

export enum WhiteboardEventEnum {
  ToggleDrawingTool = "ToggleDrawingTool",
  WhiteboardReady = "WhiteboardReady",
  WhiteboardError = "WhiteboardError",
  UpdateDrawingBoard = "UpdateDrawingBoard",
  WhiteboardSendAddAckData = "WhiteboardSendAddAckData",
}

interface DataChannel {
  type: string;
  data?: any;
}

type Events = {
  [TRTCSDKEnum.INIT]: any;
  [TRTCSDKEnum.Ready]: ITencentKeyResponseProps;
  [MeetingEventEnum.SecureEvent]: DataChannel;
  [MeetingEventEnum.RecordEvent]: DataChannel;
  [MeetingEventEnum.MemberManagerEvent]: DataChannel;
  [MeetingEventEnum.LeaveMeeting]: undefined;
  [MeetingEventEnum.MeetingEnded]: undefined;
  [MeetingEventEnum.KickOutMeeting]: undefined;
  [MeetingEventEnum.StopShare]: undefined;
  [WhiteboardEventEnum.ToggleDrawingTool]: boolean;
  [WhiteboardEventEnum.WhiteboardReady]: undefined;
  [WhiteboardEventEnum.WhiteboardError]: undefined;
  [WhiteboardEventEnum.UpdateDrawingBoard]: WhiteboardDataType;
  [WhiteboardEventEnum.WhiteboardSendAddAckData]: WhiteboardDataType;
};

// Event bus third-party library
import { WhiteboardDataType } from "@/utils/trtc/roomService";
import mitt from "mitt";
const bus = mitt<Events>();
export default bus;
