export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  deleted: boolean;
}

export interface EditOperation {
  type: "cut" | "delete" | "restore";
  segments: VideoSegment[];
  timestamp: number;
}

export enum EditMode {
  INITIAL = "initial",
  CUT = "cut",
  DELETE = "delete",
}
