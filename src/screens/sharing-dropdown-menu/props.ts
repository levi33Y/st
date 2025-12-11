export const MeetingDropdownEnum = {
  Invite: "invite",
  Security: "security",
  Function: "function",
} as const;

export type MeetingDropdownType =
  (typeof MeetingDropdownEnum)[keyof typeof MeetingDropdownEnum];
