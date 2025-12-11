import TRTCCloud, { TRTCDeviceInfo } from "trtc-electron-sdk";
import { onMounted, reactive, ref } from "vue";
import { useSettingsStore } from "../../../../stores/useSettingsStore";
import loudness from "../../../../utils/loudness";
import { AudioManage } from "./audio-manage";

interface MediaDeviceInfo {
  deviceId: string;
  groupId: string;
  kind: MediaDeviceKind;
  label: string;
}

export const useAction = () => {
  const settingsStore = useSettingsStore();

  const trtcCloud = TRTCCloud.getTRTCShareInstance();

  const audioOutputDevices = ref<TRTCDeviceInfo[]>([]);

  const audioInputDevices = ref<TRTCDeviceInfo[]>([]);

  const audioManage = ref(new AudioManage());

  const state = reactive({
    frameCount: 0,
    isPlay: audioManage.value.isPlay,
    audioOutputDeviceId: "",
    audioInputDeviceId: "",
    volume: 0,
    using: false,
  });

  const setVolume = async (volume: number) => {
    loudness.setVolume(volume);
    settingsStore.volume = volume;
    state.frameCount = 3;
  };

  const setMuted = async () => {
    const muted = !settingsStore.muted;
    await loudness.setMuted(muted);
    settingsStore.muted = muted;
  };

  const onPlay = () => {
    state.isPlay = !state.isPlay;

    state.isPlay
      ? trtcCloud.startSpeakerDeviceTest(`${window.location.origin}/horse.mp3`)
      : trtcCloud.stopSpeakerDeviceTest();
  };

  const getAudioDevices = async () => {
    const inputDevices = trtcCloud.getMicDevicesList() ?? [];

    const outputDevices = trtcCloud.getSpeakerDevicesList() ?? [];

    audioInputDevices.value = inputDevices;

    audioOutputDevices.value = outputDevices;

    settingsStore.handleUpdateAudioDevice();

    if (
      inputDevices.some(
        (device) => device.deviceId === settingsStore.audioInputDeviceId,
      )
    ) {
      state.audioInputDeviceId = settingsStore.audioInputDeviceId;
    } else {
      state.audioInputDeviceId = inputDevices[0].deviceId;
    }

    if (
      outputDevices.some(
        (device) => device.deviceId === settingsStore.audioOutputDeviceId,
      )
    ) {
      state.audioOutputDeviceId = settingsStore.audioOutputDeviceId;
    } else {
      state.audioOutputDeviceId = outputDevices[0]?.deviceId;
    }

    state.volume = await loudness.getVolume();

    trtcCloud.setCurrentSpeakerDevice(settingsStore.audioOutputDeviceId);
  };

  const loop = () => {
    requestAnimationFrame(async () => {
      loudness.getStatus().then(([volume, muted]) => {
        if (state.frameCount > 0) {
          state.frameCount--;
        } else {
          settingsStore.muted = muted;
          settingsStore.volume = volume;
        }
        loop();
      });

      !state.using && (state.volume = await loudness.getVolume());
    });
  };

  const onInputChange = () => {
    settingsStore.audioInputDeviceId = state.audioInputDeviceId;
  };

  const onOutputChange = () => {
    trtcCloud.setCurrentSpeakerDevice(state.audioOutputDeviceId);

    settingsStore.audioOutputDeviceId = state.audioOutputDeviceId;
  };

  const onDeviceMouseDown = () => {
    state.using = true;
  };

  const onDeviceMouseUp = () => {
    state.using = false;
  };

  onMounted(() => {
    getAudioDevices();

    navigator.mediaDevices.ondevicechange = async (e) => {
      getAudioDevices();
    };
    loop();
  });

  return {
    state,
    settingsStore,
    audioOutputDevices,
    audioInputDevices,
    setVolume,
    setMuted,
    onPlay,
    onOutputChange,
    onInputChange,
    onDeviceMouseDown,
    onDeviceMouseUp,
  };
};
