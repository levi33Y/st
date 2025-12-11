import { IMemberProps, ISettingProps } from "../schedule-meeting/props";

export interface IStateProps extends ISettingProps {
  isOpenPassword: boolean;
  isUserPassword: boolean;
  isPasswordVisible: boolean;
  isSetPassword: boolean;
  isModel: boolean;
  isWaitingRoomEnabled: boolean;
  participantList: IMemberProps[];
}
