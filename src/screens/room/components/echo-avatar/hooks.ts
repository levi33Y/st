import axios from "axios";
import { ElMessage } from "element-plus";
import { Ref, computed, onMounted, onUnmounted, reactive, ref } from "vue";
import {
  EchoAvatarType,
  GenerationStatus,
  SpeechStatus,
  SpeechTargetLanguageType,
} from "../../../../entity/enum";
import { MeetingSpeech } from "../../../../entity/types";
import { useScroll } from "../../../../hooks/useScroll";
import {
  getMeetingSpeechList,
  saveAudio,
  saveToneSettingApi,
  updateMeetingSpeech,
} from "../../../../services";
import { useAppStore } from "../../../../stores/useAppStore";
import { getAudioTrack, getDefaultAudioInputDeviceId } from "../../utils";
import { EchoAvatarProps } from "./props";
import config from "../../../../config";

export const echoToSpeechMapping: { [key: number]: SpeechTargetLanguageType } =
  {
    0: SpeechTargetLanguageType.Cantonese,
    1: SpeechTargetLanguageType.Mandarin,
    2: SpeechTargetLanguageType.English,
    3: SpeechTargetLanguageType.Korean,
    4: SpeechTargetLanguageType.Spanish,
  };
interface TonesList {
  voiceId: string;
  voiceName: string;
  inferenceRecords: InferenceRecord[];
}
interface InferenceRecord {
  speed: number;
  transpose: number;
  style: number;
  id: number;
  language: number;
}
export const useAction = (props: EchoAvatarProps) => {
  const appStore = useAppStore();

  const { scrollbar, scrollToBottom } = useScroll();

  const recorder = ref<MediaRecorder>();

  const blobs: Ref<Blob[]> = ref<Blob[]>([]);

  let getListTimer: NodeJS.Timeout | undefined = undefined;

  const state = reactive<{
    speechLanguageType: SpeechTargetLanguageType;
    targetLanguageType: SpeechTargetLanguageType;
  }>({
    speechLanguageType: SpeechTargetLanguageType.Cantonese,
    targetLanguageType: SpeechTargetLanguageType.Cantonese,
  });
  const toneVoice = ref<TonesList>({
    voiceId: "",
    voiceName: "",
    inferenceRecords: [],
  });

  const targetLanguages = ref([
    {
      label: "粵語",
      value: SpeechTargetLanguageType.Cantonese,
    },
    {
      label: "普通話",
      value: SpeechTargetLanguageType.Mandarin,
    },
    {
      label: "英語",
      value: SpeechTargetLanguageType.English,
    },
    // {
    //   label: "日本语",
    //   value: SpeechTargetLanguageType.Japanese,
    // },
    {
      label: "韓語",
      value: SpeechTargetLanguageType.Korean,
    },
    {
      label: "西班牙語",
      value: SpeechTargetLanguageType.Spanish,
    },
    // {
    //   label: "法语",
    //   value: SpeechTargetLanguageType.French,
    // },
  ]);
  const cloneLanguages = ref<
    { label: String; value: SpeechTargetLanguageType }[]
  >([]);

  const listenedLanguages = ref([
    {
      label: "粵語",
      value: SpeechTargetLanguageType.Cantonese,
    },
    {
      label: "普通話",
      value: SpeechTargetLanguageType.Mandarin,
    },
    {
      label: "英語",
      value: SpeechTargetLanguageType.English,
    },
    {
      label: "韓語",
      value: SpeechTargetLanguageType.Korean,
    },
    {
      label: "西班牙語",
      value: SpeechTargetLanguageType.Spanish,
    },
  ]);

  const currentVoice = ref(true);

  const isNewSpeech = ref(false);

  const meetingSpeechList = ref<MeetingSpeech[]>([]);

  const isSpeaking = ref(false);

  const countdown = ref(0);

  const timer = ref<NodeJS.Timeout>();

  const isShowRecordList = computed(() => toneVoice.value?.voiceId);

  const choiceCloneLanguages = computed(() =>
    currentVoice.value ? targetLanguages.value : cloneLanguages.value,
  );
  const setCurrentVoiceSettings = () => {
    state.speechLanguageType = cloneLanguages.value[0].value;
    state.targetLanguageType = cloneLanguages.value[0].value;
    saveToneVoiceSetting();
  };

  const setSpeechSettings = (value: SpeechTargetLanguageType) => {
    state.speechLanguageType = value;
    saveToneVoiceSetting();
  };

  const setTargetSettings = async (value: SpeechTargetLanguageType) => {
    state.targetLanguageType = value;
    saveToneVoiceSetting();
  };

  const sendAudio = async (audioForBase64: string) => {
    const result = await saveAudio({
      meetingId: props.meetingId,
      audioForBase64,
    });
    if (result.code === 200) {
      if (result.data === "Unsuccessful") {
        ElMessage.error("語音發送失敗");
      } else {
        getList();
        props.sendEchoAvatar(EchoAvatarType.GetList);
      }
    } else {
      result.msg && ElMessage.error(result.msg);
    }
  };

  const speakingTimeout = () => {
    if (countdown.value === 0) {
      // 自动结束
      recorder.value?.stop();
      isSpeaking.value = false;
      clearTimeout(timer.value);
    } else if (isSpeaking.value) {
      timer.value = setTimeout(() => {
        countdown.value--;
        speakingTimeout();
      }, 1000);
    }
  };

  const onSpeaking = async () => {
    const deviceId = await getDefaultAudioInputDeviceId();
    if (!deviceId) {
      ElMessage({
        message: "找不到麥克風",
        type: "error",
      });
      return;
    }
    if (!isSpeaking.value) {
      isSpeaking.value = true;
      props?.updateMicMuteStatus(true);
      appStore.isEASpeaking = true;
      blobs.value = [];
      const audioTrack = await getAudioTrack(deviceId);
      recorder.value = new MediaRecorder(new MediaStream([audioTrack]));
      recorder.value.ondataavailable = (ev) => blobs.value.push(ev.data);
      recorder.value.start();
      countdown.value = 60;
      speakingTimeout();
      recorder.value.onstop = async () => {
        const blob = new Blob(blobs.value, { type: "audio/ogg; codecs=opus" });
        const reader = new FileReader();
        reader.onloadend = (e) => {
          const result = e.target?.result as string;
          if (result) {
            sendAudio(result);
          }
        };
        reader.readAsDataURL(blob);
      };
    } else {
      recorder.value?.stop();
      isSpeaking.value = false;
      appStore.isEASpeaking = false;
      countdown.value = 0;
      clearTimeout(timer.value);
    }
  };

  const updateStatus = async (value: MeetingSpeech) => {
    if (value.status === SpeechStatus.UnViewed) {
      const result = await updateMeetingSpeech(value.id, SpeechStatus.Viewed);
      if (result.code === 200) {
        getList();
      }
    }
  };

  const cancelStatus = async (value: MeetingSpeech) => {
    const result = await updateMeetingSpeech(value.id, SpeechStatus.Cancelled);
    if (result.code === 200) {
      getList();
      props.sendEchoAvatar(EchoAvatarType.GetList);
    }
  };

  // const getList = async () => {
  //   const result = await getMeetingSpeechList(props.meetingId);
  //   if (result.code === 200) {
  //     if (Array.isArray(result.data)) {
  //       const isScrollToBottom =
  //         meetingSpeechList.value.length !== result.data.length;
  //       meetingSpeechList.value = result.data;
  //       if (isScrollToBottom) {
  //         scrollToBottom();
  //       }
  //     }
  //   } else {
  //     result.msg && ElMessage.error(result.msg);
  //   }
  // };

  const getList = () => {
    stopGetList(); // 先停止之前的计时器
    if (meetingSpeechList.value.length === 0) {
      isNewSpeech.value = true;
    }
    getListTimer = setInterval(async () => {
      const result = await getMeetingSpeechList(props.meetingId);
      if (result.code === 200) {
        isNewSpeech.value = false;

        if (Array.isArray(result.data)) {
          const isScrollToBottom =
            meetingSpeechList.value.length !== result.data.length;
          meetingSpeechList.value = result.data;
          const isUnComputed = meetingSpeechList.value?.some((item) => {
            return (
              item?.voiceRecord?.generationStatus ===
                GenerationStatus.InProgress || item?.voiceRecord === null
            );
          });
          if (!isUnComputed) stopGetList();
          if (isScrollToBottom) {
            scrollToBottom();
          }
        } else {
          stopGetList();
        }
      } else {
        result.msg && ElMessage.error(result.msg);
        stopGetList();
        isNewSpeech.value = false;
      }
    }, 2000);
  };

  const stopGetList = () => {
    clearInterval(getListTimer);
    getListTimer = undefined;
  };

  //获取克隆音色的列表，先保留,后续版本应该会用到
  // const getTimbreList = async () => {
  //   const params = {
  //     page: 1,
  //     pageSize: 20,
  //     status: 30,
  //   };
  //   const headers = {
  //     Authorization: `Bearer ${appStore.access_token}`,
  //   };
  //   await axios
  //     .get("https://testsmarties.yamimeal.ca/api/EchoAvatar/voice/tones", {
  //       params,
  //       headers,
  //     })
  //     .then((response) => {
  //       const { code, data, msg } = response.data;
  //       if (code === 200) {
  //         recordsCount.value = data?.count;
  //         records.value = data?.records;
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //     });
  // };

  const getTimbreList = async () => {
    const params = {
      isDefault: true,
    };
    const headers = {
      Authorization: `Bearer ${appStore.access_token}`,
    };
    await axios
      .get(`${config.echoAvatarURL}/api/EchoAvatar/user/tone`, {
        params,
        headers,
      })
      .then((response) => {
        const { code, data, msg } = response.data;
        if (code === 200 && data !== null && data.length > 0) {
          currentVoice.value = false;
          const toneData = data[0];
          const inferenceRecords = toneData?.inferenceRecords?.map(
            (item: InferenceRecord) => {
              return {
                speed: item?.speed,
                transpose: item?.transpose,
                style: item?.style,
                inferenceRecordId: item?.id,
                language: item?.language,
              };
            },
          );
          //只是这个版本用，下个版本需要删除
          cloneLanguages.value = targetLanguages.value.filter((item) => {
            return toneData?.inferenceRecords?.some((x: InferenceRecord) => {
              return echoToSpeechMapping[x?.language] === item?.value;
            });
          });
          state.speechLanguageType = cloneLanguages.value[0].value;
          state.targetLanguageType = cloneLanguages.value[0].value;
          toneVoice.value = {
            voiceName: toneData?.echoAvatarVoice?.name,
            voiceId: toneData?.echoAvatarVoice?.uuid,
            inferenceRecords: inferenceRecords,
          };
        }
        saveToneVoiceSetting();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  const settingData = () => {
    if (currentVoice.value) {
      return {
        meetingId: props.meetingId,
        voiceId: "",
        isSystem: true,
        voiceName: "",
        selfLanguage: state.speechLanguageType,
        listeningLanguage: state.targetLanguageType,
      };
    } else {
      const selectToneVoice = toneVoice.value.inferenceRecords?.find(
        (item) =>
          echoToSpeechMapping[item?.language] === state.targetLanguageType,
      );
      return {
        meetingId: props.meetingId,
        voiceId: toneVoice.value?.voiceId,
        isSystem: false,
        voiceName: toneVoice.value?.voiceName,
        speed: selectToneVoice?.speed,
        transpose: selectToneVoice?.transpose,
        style: selectToneVoice?.style,
        inferenceRecordId: selectToneVoice?.id,
        selfLanguage: state.speechLanguageType,
        listeningLanguage: state.targetLanguageType,
      };
    }
  };

  const saveToneVoiceSetting = async () => {
    const { code } = await saveToneSettingApi(settingData());
    if (code === 200) {
      getList();
    } else {
      ElMessage.error("保存失敗");
    }
  };

  onMounted(() => {
    getTimbreList();
  });
  onUnmounted(() => {
    stopGetList();
  });

  return {
    appStore,
    scrollbar,
    state,
    targetLanguages,
    listenedLanguages,
    isSpeaking,
    countdown,
    meetingSpeechList,
    isShowRecordList,
    currentVoice,
    toneVoice,
    isNewSpeech,
    choiceCloneLanguages,
    onSpeaking,
    setSpeechSettings,
    setTargetSettings,
    setCurrentVoiceSettings,
    getList,
    updateStatus,
    cancelStatus,
    saveToneVoiceSetting,
  };
};
