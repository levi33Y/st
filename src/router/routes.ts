import MeetingInvitationTransfer from "@/screens/meeting-invitation-confirm/index.vue";
import MeetingInvitationDialog from "@/screens/meeting-invitation-notice/index.vue";
import MeetingScheduleDialog from "@/screens/meeting-schedule-notice/index.vue";
import RoomLeaveDialog from "@/screens/room-leave-dialog/index.vue";
import RoomMemberList from "@/screens/room-member-list/index.vue";
import ShareCanvas from "@/screens/screen-share-canvas/index.vue";
import ShareScreenDialog from "@/screens/screen-share-dialog-trtc/index.vue";
import SharingDropdownMenu from "@/screens/sharing-dropdown-menu/index.vue";
import TrtcRoomMember from "@/screens/trtc-room-member/index.vue";
import TrtcRoom from "@/screens/trtc-room/index.vue";
import TrtcScreenCanvas from "@/screens/trtc-screen-canvas/index.vue";
import TrtcScreenDialog from "@/screens/trtc-screen-dialog/index.vue";
import { RouteRecordRaw } from "vue-router";
import FeedbackList from "../screens/feedback-list/index.vue";
import HistoryMeetingDetail from "../screens/history-meeting-detail/index.vue";
import HistoryMeetingParticipant from "../screens/history-meeting-participant/index.vue";
import HistoryMeeting from "../screens/history-meeting/index.vue";
import Home from "../screens/home/index.vue";
import IntelligentDetail from "../screens/intelligent-detail/index.vue";
import IntelligentList from "../screens/intelligent-list/index.vue";
import Invite from "../screens/invite/index.vue";
import JoinMeeting from "../screens/join-meeting/index.vue";
import Login from "../screens/login/index.vue";
import MeetingMember from "../screens/meeting-member/index.vue";
import Meeting from "../screens/meeting/index.vue";
import ScheduleMeetingCycle from "../screens/schedule-meeting-cycle/index.vue";
import ScheduleMeetingDetail from "../screens/schedule-meeting-detail/index.vue";
import ScheduleMeetingHost from "../screens/schedule-meeting-host/index.vue";
import ScheduleMeetingParticipant from "../screens/schedule-meeting-participant/index.vue";
import ScheduleMeetingSetting from "../screens/schedule-meeting-setting/index.vue";
import ScheduleMeeting from "../screens/schedule-meeting/index.vue";
import ScreenBorder from "../screens/screen-border/index.vue";
import ScreenName from "../screens/screen-name/index.vue";
import Settings from "../screens/settings/index.vue";
import VersionUpdate from "../screens/version-update/index.vue";

export const routes: RouteRecordRaw[] = [
  {
    path: "/home",
    name: "home",
    component: Home,
  },
  {
    path: "/",
    name: "login",
    component: Login,
  },
  {
    path: "/join-meeting",
    name: "joinMeeting",
    component: JoinMeeting,
  },
  {
    path: "/schedule-meeting",
    name: "scheduleMeeting",
    component: ScheduleMeeting,
  },
  {
    path: "/history-meeting",
    name: "historyMeeting",
    component: HistoryMeeting,
  },
  {
    path: "/history-meeting-detail",
    name: "historyMeetingDetail",
    component: HistoryMeetingDetail,
  },
  {
    path: "/history-meeting-participant",
    name: "historyMeetingParticipant",
    component: HistoryMeetingParticipant,
  },
  {
    path: "/intelligent-list",
    name: "intelligentList",
    component: IntelligentList,
  },
  {
    path: "/intelligent-detail",
    name: "intelligentDetail",
    component: IntelligentDetail,
  },
  {
    path: "/meeting",
    name: "meeting",
    component: Meeting,
  },
  {
    path: "/settings",
    name: "settings",
    component: Settings,
  },
  {
    path: "/feedback-list",
    name: "feedbackList",
    component: FeedbackList,
  },
  /*  {
    path: "/room",
    name: "room",
    component: Room,
  },*/
  {
    path: "/invite",
    name: "invite",
    component: Invite,
  },
  {
    path: "/screen-name/:index",
    name: "screenName",
    component: ScreenName,
  },
  {
    path: "/screen-border",
    name: "screenBorder",
    component: ScreenBorder,
  },
  {
    path: "/schedule-meeting-detail",
    name: "scheduleMeetingDetail",
    component: ScheduleMeetingDetail,
  },
  {
    path: "/meeting-member",
    name: "meetingMember",
    component: MeetingMember,
  },
  {
    path: "/schedule-meeting-host",
    name: "scheduleMeetingHost",
    component: ScheduleMeetingHost,
  },
  {
    path: "/schedule-meeting-participant",
    name: "scheduleMeetingParticipant",
    component: ScheduleMeetingParticipant,
  },
  {
    path: "/schedule-meeting-setting",
    name: "scheduleMeetingSetting",
    component: ScheduleMeetingSetting,
  },
  {
    path: "/share-canvas",
    name: "shareCanvas",
    component: ShareCanvas,
  },
  {
    path: "/share-screen-dialog",
    name: "ShareScreenDialog",
    component: ShareScreenDialog,
  },
  {
    path: "/room-member-list",
    name: "RoomMemberList",
    component: RoomMemberList,
  },
  {
    path: "/room-leave-dialog",
    name: "RoomLeaveDialog",
    component: RoomLeaveDialog,
  },
  {
    path: "/version-update",
    name: "versionUpdate",
    component: VersionUpdate,
  },
  {
    path: "/schedule-meeting-cycle",
    name: "scheduleMeetingCycle",
    component: ScheduleMeetingCycle,
  },
  {
    path: "/trtc-room",
    name: "TrtcRoom",
    component: TrtcRoom,
  },
  {
    path: "/trtc-room-member",
    name: "TrtcRoomMember",
    component: TrtcRoomMember,
  },
  {
    path: "/trtc-screen-canvas",
    name: "TrtcScreenCanvas",
    component: TrtcScreenCanvas,
  },
  {
    path: "/trtc-screen-dialog",
    name: "TrtcScreenDialog",
    component: TrtcScreenDialog,
  },
  {
    path: "/meeting-schedule-notice",
    name: "MeetingScheduleDialog",
    component: MeetingScheduleDialog,
  },
  {
    path: "/meeting-invitation-notice",
    name: "MeetingInvitationDialog",
    component: MeetingInvitationDialog,
  },
  {
    path: "/meeting-invitation-confirm",
    name: "MeetingInvitationTransfer",
    component: MeetingInvitationTransfer,
  },
  {
    path: "/sharing-dropdown-menu",
    name: "SharingDropdownMenu",
    component: SharingDropdownMenu,
  },
];
