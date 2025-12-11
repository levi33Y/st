import { ElMessageBox } from "element-plus";
import {
  ElMessageBoxOptions,
  MessageBoxData,
} from "element-plus/es/components/message-box/src/message-box.type";

export const messageBox = (
  actions: ElMessageBoxOptions,
  callback?: (action?: MessageBoxData) => void,
) => {
  ElMessageBox.close();

  ElMessageBox({
    showClose: false,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    confirmButtonText: "確認",
    ...actions,
  })
    .then((action) => {
      callback?.(action);
    })
    .catch(() => callback?.());
};
