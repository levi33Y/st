import { StoreEventEnum } from "@/entity/enum";
import TRTCCloud, {
  TRTCScreenCaptureSourceInfo,
  TRTCScreenCaptureSourceType,
} from "trtc-electron-sdk";
import { computed, nextTick, onMounted, ref } from "vue";
import { getMediaDeviceAccessAndStatus } from "../../utils/media";

export const useAction = () => {
  const desktopSources = ref<TRTCScreenCaptureSourceInfo[]>();

  const currentSource = ref<TRTCScreenCaptureSourceInfo>();

  const screenSources = computed(
    () =>
      desktopSources.value?.filter(
        (source) =>
          source.type ===
          TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeScreen,
      ) ?? [],
  );

  const onCancel = () => {
    window.windowControl.close("/share-screen-dialog");
  };

  const onConfirm = () => {
    if (!currentSource.value || !currentSource.value?.sourceId) {
      return;
    }

    const current = {
      ...currentSource.value,
      iconBGRA: null,
      thumbBGRA: null,
    } as any;

    window.store.dispatch(StoreEventEnum.ShareScreen, JSON.stringify(current));

    nextTick(() => {
      window.windowControl.close("/share-screen-dialog");
    });
  };

  const onGetSources = async () => {
    const pass = await getMediaDeviceAccessAndStatus("screen", true);

    if (!pass) return;

    const trtcCloud = TRTCCloud.getTRTCShareInstance();

    desktopSources.value = trtcCloud.getScreenCaptureSources(120, 68, 50, 50);
  };

  onMounted(onGetSources);

  return {
    screenSources,
    currentSource,
    onGetSources,
    onCancel,
    onConfirm,
  };
};
