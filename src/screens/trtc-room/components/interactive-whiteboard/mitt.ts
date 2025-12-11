import { DrawingTool } from "@/entity/enum";

type Events = {
  ["ToggleDrawingTool"]: boolean;
  ["change"]: DrawingTool;
  ["action"]: DrawingTool;
  ["openDrawingTool"]: void;
  ["closeDrawingTool"]: void;
  ["mouseleaveDrawingTool"]: void;
  ["mouseenterDrawingTool"]: void;
  ["lineSize"]: number;
  ["lineColor"]: string;
};

// Event bus third-party library
import mitt from "mitt";
export const interactiveWhiteboardBus = mitt<Events>();
