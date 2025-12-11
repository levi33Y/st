import { armsService } from "@components/arms/ArmsService";
import { ElMessage } from "element-plus";
import { marked } from "marked";
import { onMounted, reactive } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "../../stores/useAppStore";

export enum IDownloadingEnum {
  Pending,
  Processing,
  Success,
}

export const useAction = () => {
  const appStore = useAppStore();

  const { query } = useRoute();

  const releaseInfo = reactive({
    newVersion: "",
    releaseNotes: "",
  });

  const updateState = reactive<{
    downloading: IDownloadingEnum;
    processRate: number;
  }>({
    downloading: IDownloadingEnum.Pending,
    processRate: 0,
  });

  const onDownloadUpdate = async () =>
    await window.autoUpdater.downloadUpdate();

  const onQuitAndInstall = async () =>
    await window.autoUpdater.quitAndInstall();

  onMounted(async () => {
    const decodedData = decodeURIComponent(query.releaseInfoJson as string);

    releaseInfo.newVersion = JSON.parse(decodedData).version;

    releaseInfo.releaseNotes = await marked.parse(
      JSON.parse(decodedData).releaseNotes,
    );

    window.ipcRenderer.on("update-error", (_, errorMessage: string) => {
      armsService.addApi(
        JSON.stringify({
          code: "UPDATE ERROR",
          msg: errorMessage,
        }),
        false,
      );

      console.log(errorMessage);

      ElMessage.error(errorMessage);
    });

    window.ipcRenderer.on("download-progress", (_event: any, progress) => {
      console.log(progress);

      console.log(progress.percent);

      updateState.downloading = IDownloadingEnum.Processing;

      updateState.processRate = progress.percent.toFixed(2);
    });

    window.ipcRenderer.on("update-downloaded", () => {
      armsService.addApi(
        JSON.stringify({
          code: "UPDATE DOWNLOAD COMPLETED",
          msg: "更新包下载完成",
        }),
        false,
      );

      console.log("下載完成");

      updateState.downloading = IDownloadingEnum.Success;
    });
  });

  return {
    appStore,
    releaseInfo,
    updateState,
    IDownloadingEnum,
    onDownloadUpdate,
    onQuitAndInstall,
  };
};
