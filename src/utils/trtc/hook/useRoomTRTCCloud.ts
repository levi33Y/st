import { useNavigation } from "@/hooks/useNavigation";
import { GetTencentKey } from "@/services/apis/trtc";
import { messageBox } from "@/utils/message-box";
import emitter, { TRTCSDKEnum } from "@/utils/trtc/hook/useMitt";
import TencentCloudChat, { ChatSDK } from "@tencentcloud/chat";
import { useTimeoutPoll } from "@vueuse/core";
import TRTCCloud from "trtc-electron-sdk";

const roomEngine: Record<string, TRTCCloud | ChatSDK | null> = {
  TRTCCloudInstance: TRTCCloud.getTRTCShareInstance(),
  ChatInstance: null,
};

const navigation = useNavigation();

const roomPage = "/trtc-room";

export default function useGetRoomEngine() {
  return roomEngine;
}
emitter.on(TRTCSDKEnum.INIT, async () => {
  console.log("sdk init");

  const fetchData = async () => {
    try {
      const res = await GetTencentKey();

      if (res?.code !== 200) {
        pause();

        messageBox(
          {
            message: res?.msg ?? "服務異常",
            showCancelButton: true,
            confirmButtonText: "重新入會",
            cancelButtonText: "離開會議",
          },
          (flag) => {
            if (flag === "confirm") {
              resume();
            } else {
              navigation.destroy(roomPage);
            }
          },
        );

        return;
      }

      roomEngine.ChatInstance = TencentCloudChat.create({
        SDKAppID: Number(res?.data.appId),
      });

      roomEngine.ChatInstance.setLogLevel(0); // 普通级别，日志量较多，接入时建议使用

      // roomEngine.ChatInstance.registerPlugin({
      //   "tim-upload-plugin": TIMUploadPlugin,
      // });

      emitter.emit(TRTCSDKEnum.Ready, { ...res?.data });

      pause();
    } catch {}
  };

  const { resume, pause } = useTimeoutPoll(fetchData, 5000, {
    immediate: true,
    immediateCallback: true,
  });
});
