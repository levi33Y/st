export enum RecordMittEnum {
  StartRecord = "start-record",
  StopRecord = "stop-record",
  UpdateRecord = "update-record",
  RecordSpeak = "record-speak",
}

export enum MoreFunctionEnum {
  InteractiveEditing = "InteractiveEditing",
}

export interface IRoomEmitsProps {
  (event: "reloadToggle"): void;
}

export enum SecurityMenuSubscribeEnum {
  Close = "Close",
  Lock = "Lock",
  Wait = "Wait",
}
