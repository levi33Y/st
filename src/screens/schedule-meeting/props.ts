import { MeetingRepeatType } from "../../entity/enum";
import { GetMeetingInfoResponse } from "../../services/apis/meeting/types";

export interface IMemberProps {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ScheduleMeetingChannelMessageProps {
  type: ScheduleMeetingChannelMessageEnum;
  content: any;
}

export enum ScheduleMeetingChannelMessageEnum {
  ScheduleMeetingSetting,
  ScheduleMeetingParticipant,
  ScheduleMeetingCycle,
}

export interface IStateProps {
  id: string;
  meetingTitle: string;
  meetingMemberList: IMemberProps[];
  meetingStartDate: string;
  meetingEndDate: string;
  meetingStartTime: string;
  meetingEndTime: number;
  meetingTimeZone: string;
  meetingCycle: MeetingRepeatType | string;
  isModel?: boolean;
}
export interface ISettingProps {
  hostList: IMemberProps[];
  meetingPassword: string;
  isMuted: boolean;
  isRecorded: boolean;
  isMetis: boolean;
  isWaitingRoomEnabled: boolean;
}

export interface IParticipantState {
  participantList: IMemberProps[];
  isShowMeetingAllMember: boolean;
  meetingMemberSearch: string;
}

export interface ICycleProps
  extends Pick<
    GetMeetingInfoResponse,
    | "repeatType"
    | "customizeRepeatType"
    | "repeatInterval"
    | "repeatWeekdays"
    | "repeatMonthDays"
  > {
  repeatContent: string;
  meetingCycleEndingTime?: string;
}
