import { IMeetingInfoProps, IUserInfoProps } from "@/utils/trtc/store/room";
import {
  INoJoinMeetingUsersProps,
  InvitationStatusEnum,
  IWaitingRoomUserSessionsProps,
  MeetingPermissionEnum,
} from "../../../../services/apis/meeting/types";
import { ParticipantStream } from "../../../../utils/livekit/ParticipantStream";

export interface IManagementMemberProps extends IUserInfoProps {
  isActive?: boolean;
  invitationStatus?: InvitationStatusEnum;
}

export enum MemberListTabEnum {
  Meeting,
  Wait,
  NoJoin,
}

export enum MemberListEventEnum {
  ChangeName,
  Mute,
  AllMute,
  Role,
  Remove,
  MoveToWait,
  Access,
  RemoveWait,
  AutoAccess,
  AllAccess,
  AllRemove,
  Call,
}

export interface IProps {
  meetingInfo: IMeetingInfoProps;
  streamList: Array<IUserInfoProps>;
  noJoinMeetingUsers: INoJoinMeetingUsersProps[];
  waitingRoomUserSessions: IWaitingRoomUserSessionsProps[];
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

export interface IConfirmProps {
  message?: string;
  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}
