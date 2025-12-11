import { useDebounceFn, watchDebounced } from "@vueuse/core";
import { ElMessage } from "element-plus";
import moment from "moment-timezone";
import { onMounted, reactive } from "vue";
import {
  GetFeedbackList,
  UpdateFeedbackTodo,
} from "../../services/apis/feedback";
import {
  FeedbackTypeConst,
  FeedbackTypeEnum,
  GetFeedbackListItem,
} from "../../services/apis/feedback/types";
import { useAppStore } from "../../stores/useAppStore";
import { exportByExcel } from "../../utils/fileUtils";
import {
  IFeedbackDetailDialogState,
  IFeedbackListState,
  IFeedbackStateProps,
  ITableDataProps,
} from "./props";

export const useAction = () => {
  const appStore = useAppStore();

  const state = reactive<IFeedbackStateProps>({
    keyWord: "",
    page: 1,
    pageSize: 10,
    loading: false,
  });

  const feedbackListState = reactive<IFeedbackListState>({
    count: 0,
    dataList: [],
  });

  const feedbackDetailDialogState = reactive<IFeedbackDetailDialogState>({
    id: "",
    userName: "",
    describe: "",
    updateTime: "",
    visible: false,
  });

  const onFeedbackDetail = (row: ITableDataProps) => {
    feedbackDetailDialogState.id = row?.id ?? "";
    feedbackDetailDialogState.userName = row?.userName ?? "";
    feedbackDetailDialogState.types = row?.types;
    feedbackDetailDialogState.describe = row?.describe ?? "";
    feedbackDetailDialogState.updateTime = row?.updateTime ?? "";
    feedbackDetailDialogState.visible = true;
  };

  const onReadingLabel = (type: FeedbackTypeEnum) => {
    let result: string = "";

    switch (type) {
      case FeedbackTypeEnum.Suggestions:
        result = "proposal";

        break;
      case FeedbackTypeEnum.Defect:
        result = "defect";

        break;
      case FeedbackTypeEnum.Information:
        result = "consultation";

        break;
      case FeedbackTypeEnum.Other:
        result = "other";

        break;
      default:
        break;
    }

    return result;
  };

  const onGetFeedbackList = () => {
    state.loading = true;

    GetFeedbackList({
      KeyWord: state.keyWord,
      PageIndex: state.page,
      PageSize: state.pageSize,
    })
      .then(({ data }) => {
        feedbackListState.count = data?.count ?? 0;

        feedbackListState.dataList =
          data?.feedbackDto?.map((item: GetFeedbackListItem) => ({
            id: item?.feedbackId + "",
            userName: item?.creator,
            describe: item?.description,
            updateTime: moment(item?.lastModifiedDate).format(
              "YYYY-MM-DD HH:mm:ss",
            ),
            types: item?.categories ?? [],
          })) ?? [];

        onUpdateTodo();
      })
      .catch((err) => {
        ElMessage.error(err?.types?.at(0)?.message ?? err.message);
      })
      .finally(() => {
        state.loading = false;
      });
  };

  const onUpdateTodo = () => {
    UpdateFeedbackTodo().catch((err) => {
      ElMessage.error(err?.types?.at(0)?.message ?? err.message);
    });
  };

  const onSearch = useDebounceFn(() => {
    if (state.page !== 1) {
      state.page = 1;

      return;
    }

    onGetFeedbackList();
  }, 300);

  const onExportList = () => {
    const tableData: string[][] = [
      ["提出人", "類別", "描述", "更新時間"],
    ].concat(
      feedbackListState.dataList?.map((item, index) => [
        item.userName,
        (item.types?.map((type) => FeedbackTypeConst[type]) ?? []).join(","),
        item.describe,
        item.updateTime,
      ]) ?? [],
    );

    exportByExcel(tableData, "問題列表");
  };

  watchDebounced(
    () => [state.page, state.pageSize],
    () => {
      onGetFeedbackList();
    },
    { debounce: 300 },
  );

  onMounted(() => {
    onGetFeedbackList();
  });

  return {
    appStore,
    state,
    feedbackListState,
    feedbackDetailDialogState,
    onReadingLabel,
    onFeedbackDetail,
    onSearch,
    onExportList,
  };
};
