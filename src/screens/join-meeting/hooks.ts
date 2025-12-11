import { useMessage } from "@/hooks/useMessage";
import { messageBox } from "@/utils/message-box";
import { existsWindow } from "@/utils/utils";
import { ElLoading, ElMessage, FormInstance, FormRules } from "element-plus";
import { isEmpty, isNil } from "lodash";
import { computed, reactive, ref } from "vue";
import { MeetingStreamMode } from "../../entity/enum";
import { useNavigation } from "../../hooks/useNavigation";
import { getMeetingInfoApi, joinMeetingApi } from "../../services";
import { useAppStore } from "../../stores/useAppStore";

const roomPage = "/trtc-room";

export const useAction = () => {
  const appStore = useAppStore();

  const navigation = useNavigation();

  const { messageServices } = useMessage();

  const formRef = ref<FormInstance>();

  const isPassword = ref(false);

  const state = reactive({
    autoAudio: true,
    microphone: false,
    enableCamera: false,
    meetingNumber: "",
    userName: appStore.userName,
    joinPassword: "",
  });

  const rules = reactive<FormRules>({
    meetingNumber: [
      { required: true, message: "會議號必填", trigger: "blur" },
      { min: 5, max: 5, message: "請輸入5位會議號", trigger: "blur" },
    ],
    userName: [{ required: true, message: "名稱必填", trigger: "blur" }],
  });

  const disabled = computed(
    () =>
      !state.meetingNumber ||
      (state.meetingNumber && state.meetingNumber.length !== 5),
  );

  const onJoinMeeting = () => {
    const loading = ElLoading.service({ fullscreen: true });

    formRef.value?.validate(async (valid) => {
      const isHas = await existsWindow(roomPage);

      if (isHas || !valid) {
        loading.close();

        return;
      }

      try {
        const { code, data, msg } = await getMeetingInfoApi({
          meetingNumber: state.meetingNumber,
          includeUserSession: false,
        });

          if (code !== 200) {
            ElMessage({
              offset: 36,
              message: msg,
              type: "error",
            });

          return;
        }

        if (
          data.meetingMasterUserId + "" != appStore.userInfo.id + "" &&
          data.createdBy + "" != appStore.userInfo.id + "" &&
          data.isLocked
        ) {
          loading.close();

          messageServices("會議已鎖定，如需加入請聯繫主持人。");

          return;
        }

        isPassword.value = data?.isPasswordEnabled;

        if (!isPassword.value) {
          toRoom();
        }
      } catch {
        ElMessage({
          message: "入會失敗",
          type: "error",
        });
      } finally {
        loading.close();
      }
    });
  };
  const confirmPassword = async (password: string) => {
    state.joinPassword = password;
    const loading = ElLoading.service({ fullscreen: true });
    try {
      const { code, msg, data } = await joinMeetingApi({
        meetingNumber: state.meetingNumber,
        isMuted: !state.microphone,
        securityCode: password,
      });
      if (code === 200) {
        isPassword.value = false;
        toRoom();
      } else {
        ElMessage({
          offset: 36,
          message: msg,
          type: "error",
        });
      }
    } finally {
      loading.close();
    }
  };
  const toRoom = () => {
    if (isNil(state.meetingNumber) || isEmpty(state.meetingNumber)) {
      messageBox(
        {
          message: "入會失敗",
          confirmButtonText: "確定",
        },
        () => {},
      );

      return;
    }

    navigation.close().navigate(roomPage, {
      ...state,
      isMuted: !state.microphone,
      meetingStreamMode: MeetingStreamMode.SFU,
    });
  };
  return {
    formRef,
    rules,
    state,
    disabled,
    isPassword,
    confirmPassword,
    onJoinMeeting,
  };
};
