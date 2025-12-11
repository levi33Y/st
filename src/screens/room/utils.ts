import { useRafFn } from "@vueuse/core";
import { ElMessage } from "element-plus";
import { Room } from "livekit-client";
import { nextTick } from "vue";
import { useAppStore } from "../../stores/useAppStore";
import { useSettingsStore } from "../../stores/useSettingsStore";

export const getDevices = async (kind?: MediaDeviceKind) =>
  await Room.getLocalDevices(kind);

export const getDefaultAudioInputDeviceId = async () => {
  const devices = await getDevices("audioinput");
  return devices?.[0]?.deviceId ?? "";
};

export const getAudioTrack = (deviceId?: string) =>
  new Promise<MediaStreamTrack>((resolve, reject) =>
    navigator.mediaDevices
      .getUserMedia({
        video: false,
        audio: deviceId
          ? {
              deviceId,
              echoCancellation: true,
              noiseSuppression: true,
            }
          : true,
      })
      .then((stream) => {
        const audioTrack = stream?.getAudioTracks()?.[0];
        if (audioTrack) {
          resolve(audioTrack);
        } else {
          reject(new Error("Could not start audio source"));
        }
      })
      .catch(reject),
  );

export const getVideoTrack = (sourceId: string) =>
  new Promise<MediaStreamTrack>((resolve, reject) =>
    navigator.mediaDevices
      .getUserMedia({
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
            minWidth: 2560,
            minHeight: 1440,
          },
        } as MediaTrackConstraints,
        audio: false,
      })
      .then((stream) => {
        const videoTrack = stream?.getVideoTracks()?.[0];
        if (videoTrack) {
          resolve(videoTrack);
        } else {
          reject(new Error("Could not start video source"));
        }
      })
      .catch(reject),
  );

export const getSharingTrackByVb = async (
  sourceId?: string,
  isShareAudio?: boolean,
) => {
  const appStore = useAppStore();

  const settingStore = useSettingsStore();

  let stream: {
    videoStream: MediaStream | null;
    audioStream: MediaStream | null;
  } = {
    videoStream: null,
    audioStream: null,
  };

  const track: {
    videoTrack: MediaStreamTrack | null;
    audioTrack: MediaStreamTrack | null;
  } = {
    videoTrack: null,
    audioTrack: null,
  };

  try {
    /*if (settingStore?.virtualAudioLine && isShareAudio) {
      console.log(settingStore?.virtualAudioLine);

      const as = settingStore?.virtualAudioLine?.deviceId
        ? await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
              deviceId: settingStore?.virtualAudioLine?.deviceId,
              echoCancellation: true,
              noiseSuppression: true,
            },
          })
        : null;

      stream.audioStream = as;

      track.audioTrack = as ? as?.getAudioTracks()[0] : null;
    }*/

    const vs = sourceId
      ? await navigator.mediaDevices.getUserMedia({
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: sourceId,
              minWidth: 2560,
              minHeight: 1440,
            },
          } as MediaTrackConstraints,
          audio: false,
        })
      : null;

    stream.videoStream = vs;

    track.videoTrack = stream.videoStream?.getVideoTracks()[0] ?? null;
  } catch (err) {
    ElMessage({
      message: "共享屏幕異常" + err,
      type: "error",
    });
  }

  return {
    track,
    stream,
  };
};

export const waitAnimationFrames = (callback: () => void) => {
  nextTick()
    .then(
      () =>
        new Promise((resolve) => {
          let count = 0;

          useRafFn(() => {
            count++;

            count > 15 && resolve(true);
          });
        }),
    )
    .then(() => callback());
};

export const waitAnimationFrame = (): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
};
