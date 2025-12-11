import { DataChannelCommand } from "@/entity/enum";
import { recordSpeakApi } from "@/services";
import {
  CloudRecordCreate,
  CloudRecordStop,
  CloudRecordUpdate,
} from "@/services/apis/trtc";
import { roomService } from "@/utils/trtc/roomService";
import { useDebounceFn } from "@vueuse/core";
import { ElMessage } from "element-plus";
import { isEmpty, isNil } from "lodash";
import { computed, ref, toRaw } from "vue";

export const useAction = () => {
  const loading = ref(false);

  const isRecording = computed(() => {
    return roomService.roomStore.isRecording;
  });

  const isHost = computed(() => {
    return roomService.roomStore.isHasHost;
  });

  const isMuted = computed(() => roomService.roomStore.isMuted);

  const meeting = computed(() => roomService.roomStore.meeting);

  const isHasShareScreen = computed(
    () =>
      !isEmpty(roomService.roomStore.shareScreenUser) &&
      !isNil(roomService.roomStore.shareScreenUser?.sid),
  );

  const isHasCameraStream = computed(
    () => roomService.roomStore.cameraStreamUser.length > 0,
  );

  const startRecord = async () => {
    const sdkInfo = roomService.basicStore.sdk;

    const shareScreenUser = roomService.roomStore.shareScreenUser;

    const state = toRaw(roomService.roomStore.recordState);

    /*    const params: any = {
      sdkAppId: sdkInfo.SDKAppID,
      roomId: meeting.value.meetingNumber,
      recordParams: {
        recordMode: 2,
        StreamType: 0,
        outputFormat: 3,
        MediaId: 2,
      },
      RoomIdType: 1,
      MixTranscodeParams: {
        videoParams: {
          width: 1920,
          height: 1080,
          fps: 15,
          bitRate: 500000,
          gop: 10,
        },
      },
      MixLayoutParams: {
        MediaId: 0,
        MixLayoutMode: 3,
        PlaceHolderMode: 1,
      },
    };*/

    const params: any = {
      sdkAppId: sdkInfo.SDKAppID,
      roomId: meeting.value.meetingNumber,
      recordParams: {
        recordMode: 2,
        StreamType: 0,
        outputFormat: 3,
        MediaId: 2,
      },
      RoomIdType: 1,
      MixTranscodeParams: {
        videoParams: {
          width: 1920,
          height: 1080,
          fps: 15,
          bitRate: 500000,
          gop: 10,
        },
      },
      MixLayoutParams: {
        PlaceHolderMode: 1,
        // ShareScreen
        MediaId: 1,
        MixLayoutMode: 4,
        MixLayoutList: [
          {
            UserId: shareScreenUser?.sid ?? "",
            MediaId: 1,
            RenderMode: 0,
            Top: 0,
            Left: 0,
            width: 1920,
            height: 1080,
          },
        ],
      },
    };

    if (isHasCameraStream.value) {
      params.MixLayoutParams = {
        ...params.MixLayoutParams,
        MediaId: 1,
        MixLayoutMode: 2,
        MaxResolutionUserId: shareScreenUser?.sid,
      };
    }

    const { data, code, msg } = await CloudRecordCreate(params);

    if (code === 200) {
      console.log("开始录制成功", data);

      state.taskId = data.taskId;

      state.meetingRecordId = data.meetingRecordId;

      roomService.roomAction.startRecording(state);

      roomService.roomAction.publishData({
        command: DataChannelCommand.Recording,
        message: {
          isRecording: true,
          meetingRecordId: state.meetingRecordId,
          taskId: state.taskId,
        },
      });

      !isMuted && recordSpeak();
    } else {
      ElMessage({
        message: "錄製開啟失敗" + msg,
        type: "error",
      });

      throw msg;
    }
  };

  const stopRecord = async () => {
    const sdkInfo = roomService.basicStore.sdk;

    const state = toRaw(roomService.roomStore.recordState);

    if (!isNil(state.taskId) && !isEmpty(state.taskId)) {
      const stopResult = await CloudRecordStop({
        sdkAppId: sdkInfo.SDKAppID,
        taskId: state.taskId,
      });

      if (stopResult.code === 200) {
        console.log("停止录制成功", stopResult.data);

        roomService.roomAction.stopRecording();

        roomService.roomAction.publishData({
          command: DataChannelCommand.Recording,
          message: {
            isRecording: false,
            meetingRecordId: state.meetingRecordId,
            taskId: state.taskId,
          },
        });
      } else {
        console.error("停止录制失败", stopResult.msg);
      }
    }
  };

  const updateRecord = async () => {
    const sdkInfo = roomService.basicStore.sdk;

    const shareScreenUser = roomService.roomStore.shareScreenUser;

    const state = toRaw(roomService.roomStore.recordState);

    if (!state.taskId) return;

    /*    const params: any = {
      sdkAppId: sdkInfo.SDKAppID,
      taskId: state.taskId,
      MixLayoutParams: {
        MediaId: 0,
        MixLayoutMode: 3,
        PlaceHolderMode: 1,
      },
    };*/

    const params: any = {
      sdkAppId: sdkInfo.SDKAppID,
      taskId: state.taskId,
      MixLayoutParams: {
        PlaceHolderMode: 1,
        MixLayoutMode: 4,
        MixLayoutList: [
          {
            UserId: shareScreenUser?.sid ?? "",
            MediaId: 1,
            RenderMode: 0,
            Top: 0,
            Left: 0,
            width: 1920,
            height: 1080,
          },
        ],
      },
    };

    if (isHasCameraStream.value) {
      params.MixLayoutParams = {
        ...params.MixLayoutParams,
        MediaId: 1,
        MixLayoutMode: 2,
        MaxResolutionUserId: shareScreenUser?.sid,
      };
    }

    const stopResult = await CloudRecordUpdate(params);

    if (stopResult.code === 200) {
      console.log("更新录制成功", stopResult.data);
    } else {
      console.error("更新录制失败", stopResult.msg);
    }
  };

  const recordSpeak = useDebounceFn(async () => {
    const state = roomService.roomStore?.recordState;

    if (!state.isRecording || !state.taskId) {
      return;
    }

    const request = {
      meetingNumber: state.meetingNumber,
      meetingRecordId: state.meetingRecordId,
      trackId: "",
    };

    if (!isMuted.value) {
      const { data, code, msg } = await recordSpeakApi({
        ...request,
        speakStartTime: Date.now(),
      });

      if (code === 200) {
        state.speakId = data?.id;
        state.speakStartTime = data?.speakStartTime;
        roomService.roomAction.startSpeaking(state);
      }
    } else if (state.speakId) {
      await recordSpeakApi({
        ...request,
        id: state.speakId,
        speakStartTime: state.speakStartTime,
        speakEndTime: Date.now(),
      });
    }
  }, 100);

  const onClick = useDebounceFn(async () => {
    loading.value = true;

    if (!isRecording.value) {
      await startRecord();
    } else {
      await stopRecord();
    }

    loading.value = false;
  }, 300);

  return {
    isRecording,
    meeting,
    isHost,
    onClick,
    loading,
    updateRecord,
    recordSpeak,
    stopRecord,
    startRecord,
  };
};
