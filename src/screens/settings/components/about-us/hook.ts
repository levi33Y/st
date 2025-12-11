import { useDebounceFn, useTimeoutPoll } from "@vueuse/core";
import { ElMessage, FormInstance } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import { useNavigation } from "../../../../hooks/useNavigation";
import {
  AddFeedbackInfo,
  GetFeedbackTodo,
} from "../../../../services/apis/feedback";
import { useAppStore } from "../../../../stores/useAppStore";
import { IAboutUsStateProps, IFeedbackProps } from "./props";
import type { UpdateInfo } from "electron-updater";
import { debounce } from "lodash";

export const useAction = () => {
  const navigation = useNavigation();

  const appStore = useAppStore();

  const problemFormRef = ref<FormInstance>();

  const state = reactive<IAboutUsStateProps>({
    feedbackDialogVisible: false,
    listBadge: 0,
    isMarketPlayer: false,
    skeletonLoading: true,
  });

  const problemForm = reactive<IFeedbackProps>({
    types: [],
    content: "",
  });

  const appInfo = computed(() => appStore.appInfo);

  const onSubmitForm = useDebounceFn(() => {
    problemFormRef.value?.validate().then(() => {
      problemForm.submitLoading = true;

      AddFeedbackInfo({
        feedback: {
          categories: problemForm.types,
          description: problemForm?.content,
        },
      })
        .then(() => {
          state.feedbackDialogVisible = false;

          ElMessage.success("提交成功！");
        })
        .catch((err) => {
          ElMessage.error(err?.types?.at(0)?.message ?? err.message);
        })
        .finally(() => {
          problemForm.submitLoading = false;
        });
    });
  }, 300);

  const onFeedbackList = () => navigation.navigate("/feedback-list");

  const onCheckUpdate = debounce(async () => {
    if (appStore.isMeeting) {
      ElMessage.info("會中暫不支持更新");

      return;
    }

    await window.autoUpdater.checkForUpdate("/settings");
  }, 300);

  const { pause: onPauseGetFeedbackTodo, resume: onGetFeedbackTodo } =
    useTimeoutPoll(() => {
      GetFeedbackTodo()
        .then((res) => {
          state.isMarketPlayer = res.code === 200;

          state.listBadge = res.data;
        })
        .catch((err) => {
          ElMessage.error("Error" + err.message);

          onPauseGetFeedbackTodo();
        })
        .finally(() => {
          state.skeletonLoading = false;
        });
    }, 1000);

  onMounted(() => {
    window.winEvents.onFocus(() => {
      onGetFeedbackTodo();
    });

    window.winEvents.onBlur(() => {
      onPauseGetFeedbackTodo();
    });

    onGetFeedbackTodo();
  });

  onMounted(() => {
    window.ipcRenderer.on("update-available", (_, releaseInfo: UpdateInfo) => {
      console.log(releaseInfo);

      const releaseInfoJson = JSON.stringify(releaseInfo);

      navigation.navigate("/version-update", { releaseInfoJson });
    });

    window.ipcRenderer.on("update-not-available", () => {
      ElMessage.success("當前版本為最新版本");
    });

    window.ipcRenderer.on("update-error", (_, errorMessage: string) => {
      ElMessage.error(errorMessage);
    });
  });

  return {
    problemFormRef,
    state,
    problemForm,
    appInfo,
    navigation,
    onSubmitForm,
    onFeedbackList,
    onCheckUpdate,
  };
};
