import { UserSession } from "@/entity/response";
import { ParticipantStream } from "@/utils/livekit/ParticipantStream";
import { defineStore } from "pinia";
import { MeetingPermissionEnum } from "../services/apis/meeting/types";

export interface ITrTcSourceWindowProps {
  sourcesId?: string;
  sourceName?: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

export const useMeetingStore = defineStore("meetingStore", {
  state: (): {
    creatorName: string;
    creatorId: string;
    permissionList: [string, MeetingPermissionEnum][];
    desktopSourceId: string;
    isShareAudio: boolean;
    meetingId: string;
    meetingTitle: string;
    meetingNumber: string;
    desktopSourceDisplayId?: string;
    streamList: ParticipantStream[];
    shareScreenSid: string;
    shareScreenUserId: string;
    moderator: UserSession;
    isScreenShareEnabled: boolean;
    isLocked: boolean;
    localParticipantId: string;
    captureSourcesWindow: ITrTcSourceWindowProps;
    roomLastWindowSize: {
      width: number;
      height: number;
      x: number;
      y: number;
    };
  } => ({
    creatorName: "",
    creatorId: "",
    permissionList: [],
    desktopSourceId: "",
    isShareAudio: false,
    meetingId: "",
    meetingTitle: "",
    meetingNumber: "",
    desktopSourceDisplayId: "",
    streamList: [],
    shareScreenSid: "",
    moderator: {} as UserSession,
    isScreenShareEnabled: false,
    shareScreenUserId: "",
    isLocked: false,
    localParticipantId: "",
    captureSourcesWindow: {
      sourcesId: "",
      sourceName: "",
      width: 0,
      height: 0,
      x: 0,
      y: 0,
    },
    roomLastWindowSize: {
      width: 980,
      height: 640,
      x: 0,
      y: 0,
    },
  }),
  actions: {
    init() {
      this.creatorName = "";
      this.creatorId = "";
      this.permissionList = [];
      this.desktopSourceId = "";
      this.isShareAudio = false;
      this.meetingTitle = "";
      this.meetingNumber = "";
      this.desktopSourceDisplayId = "";
      this.streamList = [];
      this.shareScreenSid = "";
      this.moderator = {} as UserSession;
      this.isScreenShareEnabled = false;
      this.shareScreenUserId = "";
      this.localParticipantId = "";
    },
    joinMeeting(meetingNumber: string, localParticipantId: string) {
      this.meetingNumber = meetingNumber;
      this.localParticipantId = localParticipantId;
    },
    updatePermissionList(permissionList: [string, MeetingPermissionEnum][]) {
      this.permissionList = permissionList;
    },
    updateCreator(userId: string, name: string) {
      this.creatorName = name;

      this.creatorId = userId;
    },
    isCreator(userId: string) {
      return userId + "" === this.creatorId + "";
    },
    isModerator(userId: string) {
      const user = this.permissionList.find(
        ([key, value]) => key + "" === userId + "",
      );

      return user?.at(1) === MeetingPermissionEnum.Host;
    },
    getRole(userId: string) {
      const user = this.permissionList.find(
        ([key, value]) => key + "" === userId + "",
      );

      return user ? (user?.at(1) as MeetingPermissionEnum) : null;
    },
    setDesktopSource({
      sourcesId,
      sourceName,
      width,
      height,
      x,
      y,
    }: ITrTcSourceWindowProps) {
      console.log(
        "--setDesktopSource--",
        sourcesId,
        sourceName,
        width,
        height,
        x,
        y,
      );

      this.captureSourcesWindow = {
        sourcesId,
        sourceName,
        width,
        height,
        x,
        y,
      };
    },
    initDesktopSource() {
      this.isScreenShareEnabled = false;
      this.captureSourcesWindow = {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      };
      this.isShareAudio = false;
    },
  },
  getters: {},
  persist: true,
});
