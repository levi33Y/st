import { StoreEventEnum } from "@/entity/enum";
import { useMeetingStore } from "@/stores/useMeetingStore";
import { useToggle } from "@vueuse/core";
import { computed, nextTick, onMounted, ref } from "vue";
import { ScreenSource } from "../../entity/types";
import { useAppStore } from "../../stores/useAppStore";
import { getMediaDeviceAccessAndStatus } from "../../utils/media";

export const useAction = () => {
  const meetingStore = useMeetingStore();

  const appStore = useAppStore();

  const desktopSources = ref<ScreenSource[]>();

  const currentSource = ref<ScreenSource>();

  const currentAppIcon = ref<string>("");

  const [shareAudio, onToggleAudio] = useToggle(false);

  const screenSources = computed(
    () => desktopSources.value?.filter((source) => !source.appIcon) ?? [],
  );

  const appSources = computed(
    () =>
      desktopSources.value?.filter(
        (source) =>
          source.appIcon &&
          (!currentAppIcon.value || source.appIcon === currentAppIcon.value),
      ) ?? [],
  );

  const appIcons = computed(
    () =>
      desktopSources.value?.reduce<string[]>((res, source) => {
        if (source.appIcon && !res.includes(source.appIcon)) {
          res.push(source.appIcon);
        }
        return res;
      }, []) ?? [],
  );

  const onGetSources = async () => {
    const pass = await getMediaDeviceAccessAndStatus("screen", true);

    if (!pass) return;

    window.desktopCapturer
      .getSources({
        types: ["window", "screen"],
        fetchWindowIcons: true,
      })
      .then((res) => {
        desktopSources.value = res;

        console.log(res);

        let screen =
          res?.filter(
            (source) =>
              source.name !== appStore.appInfo.name && !source.appIcon,
          ) ?? [];

        currentSource.value = screen?.[0];
      });
  };

  const onChoiceSources = (sources?: ScreenSource) => {
    currentSource.value = sources;
  };

  const onChoiceApp = (appIcon: string) => {
    currentAppIcon.value = appIcon;
  };

  const onSwitchAudio = () => {};

  const onCancel = () => {
    window.windowControl.close("/share-screen-dialog");
  };

  const onConfirm = () => {
    if (!currentSource.value?.id) {
      return;
    }

    meetingStore.setDesktopSource(
      currentSource.value.id,
      currentSource.value?.display_id,
      false,
    );

    window.store.dispatch(
      StoreEventEnum.ShareScreen,
      JSON.stringify({
        id: currentSource.value?.id,
        displayId: currentSource.value?.display_id,
        shareAudio: shareAudio.value,
      }),
    );

    nextTick(() => {
      window.windowControl.close("/share-screen-dialog");
    });
  };

  onMounted(() => {
    onGetSources();
  });

  return {
    appSources,
    screenSources,
    currentSource,
    currentAppIcon,
    shareAudio,
    appIcons,
    onGetSources,
    onChoiceSources,
    onChoiceApp,
    onSwitchAudio,
    onCancel,
    onConfirm,
  };
};
