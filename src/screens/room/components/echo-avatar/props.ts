import {
  EchoAvatarType,
  SpeechTargetLanguageType,
} from "../../../../entity/enum";

export interface EchoAvatarProps {
  meetingId: string;
  targetLanguageType?: SpeechTargetLanguageType;
  sendEchoAvatar: (type: EchoAvatarType, status?: boolean) => void;
  updateMicMuteStatus: (status: boolean) => Promise<void>;
}
