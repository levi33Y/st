import Display = Electron.Display;

export interface IWindowOptionProps {
  width: number;
  height: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  x?: number;
  y?: number;
}

export interface IRoomSharingProps {
  visible: boolean;
  isEnter: boolean;
  dialogVisible: boolean;
  roomSize: IWindowOptionProps;
  display?: Display;
}
