import { StoreEventEnum, useNavigation } from "@/hooks/useNavigation";
import TRTCCloud, {
  TRTCImageBuffer,
  TRTCScreenCaptureSourceInfo,
  TRTCScreenCaptureSourceType,
} from "trtc-electron-sdk";
import { computed, nextTick, onMounted, ref } from "vue";
import { getMediaDeviceAccessAndStatus } from "../../utils/media";

const pagePath = "/trtc-screen-dialog";

export const useAction = () => {
  const navigation = useNavigation();

  const desktopSources = ref<TRTCScreenCaptureSourceInfo[]>();

  const currentSource = ref<TRTCScreenCaptureSourceInfo>();

  const loading = ref(true);

  const screenSources = computed(
    () =>
      desktopSources.value?.filter(
        (source) =>
          source.type ===
          TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeScreen,
      ) ?? [],
  );

  const onCancel = () => {
    window.windowControl.close(pagePath);
  };

  const onConfirm = () => {
    if (!currentSource.value || !currentSource.value?.sourceId) {
      return;
    }

    const current: TRTCScreenCaptureSourceInfo = {
      ...currentSource.value,
      iconBGRA: {} as TRTCImageBuffer,
      thumbBGRA: {} as TRTCImageBuffer,
    };

    navigation.emit(StoreEventEnum.ShareScreen, current);

    nextTick(() => {
      navigation.destroy(pagePath);
    });
  };

  const onGetSources = async () => {
    loading.value = true;

    const pass = await getMediaDeviceAccessAndStatus("screen", true);

    if (!pass) return;

    const trtcCloud = TRTCCloud.getTRTCShareInstance();

    desktopSources.value =
      trtcCloud
        .getScreenCaptureSources(120, 68, 50, 50)
        .filter(
          (source) =>
            source.type ===
            TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeScreen,
        ) ?? [];

    loading.value = false;
  };

  onMounted(onGetSources);

  return {
    screenSources,
    currentSource,
    onGetSources,
    onCancel,
    onConfirm,
    loading,
  };
};
