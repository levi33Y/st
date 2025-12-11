import { IConfirmProps } from "@/screens/trtc-room/components/member-list/props";
import { ElMessageBox } from "element-plus";

export const confirm = (
  {
    message = "",
    title = "",
    confirmButtonText = "確認",
    cancelButtonText = "取消",
  }: IConfirmProps,
  callback: () => void,
) => {
  ElMessageBox.confirm(message, {
    confirmButtonClass: "confirm-button",
    cancelButtonClass: "cancel-button",
    title,
    confirmButtonText,
    cancelButtonText,
  }).then(() => callback());
};
