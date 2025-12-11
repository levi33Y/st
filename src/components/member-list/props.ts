import { MeetingPermissionEnum } from "../../services/apis/meeting/types";
import { ParticipantStream } from "../../utils/livekit/ParticipantStream";

export enum MemberListTabEnum {
  Meeting,
  Wait,
  Ending,
}

export enum MemberListEventEnum {
  ChangeName,
  Mute,
  AllMute,
  Role,
  Remove,
  Wait,
  SetWait,
  AllWait,
  RemoveWait,
}

export class MeetingParticipant extends ParticipantStream {
  role?: MeetingPermissionEnum | null;
}

export interface IProps {
  streamList: Array<ParticipantStream>;
  meetingPermission: Map<string, MeetingPermissionEnum | null>;
}

export interface IStateProps {
  isFocus: boolean;
  isDropdownVisible: boolean;
  searchName: string;
  loading: boolean;
  tabStatus: MemberListTabEnum;
}

export interface IDialogFormStateProps {
  dialogVisible: boolean;
  name: string;
  index?: number;
}

export interface ISetMemberVideoDataProps {
  stream?: ParticipantStream;
  isMuted: boolean;
}

export interface ISetMemberNameDataProps {
  stream?: ParticipantStream;
  name: string;
}

export enum SetMemberStatusEnum {
  remove,
}

export interface ISetMemberStatusDataProps {
  stream?: ParticipantStream;
  status: SetMemberStatusEnum;
}

export interface ISetMemberRoleDataProps {
  userId: string;
  permission: MeetingPermissionEnum;
  isCoHost: boolean | null;
}

export interface IDataEventProps {
  type: MemberListEventEnum;
  data: any;
}

export interface IEmitsProps {
  (event: "dataEvent", data: IDataEventProps): void;
}
