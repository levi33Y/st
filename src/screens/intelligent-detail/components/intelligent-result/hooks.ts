import { tagEmits } from "element-plus";
import { reactive, ref, computed, toRefs } from "vue";
import { translationSummaryApi } from "../../../../services";
import {
  RecordDetailResponse,
  SummaryRequest,
} from "../../../../services/apis/meeting/types";
export interface Props {
  recordDetail: RecordDetailResponse | null;
  resultLoading: boolean;
}

export interface Emits {
  (event: "create", summaryData: SummaryRequest): void;
  (event: "translate", language: number | undefined): void;
}
export const useAction = (props: Props, emits: Emits) => {
  const { recordDetail, resultLoading } = toRefs(props);
  const summary = reactive({
    contentType: 0,
    language: undefined as undefined | number,
    speakInfos: [],
  });
  const value = ref("");
  const languageList = reactive([
    {
      label: "中文",
      value: 0,
    },
    {
      label: "英文",
      value: 1,
    },
    {
      label: "西文",
      value: 2,
    },
    {
      label: "韓文",
      value: 3,
    },
  ]);
  const checkedSummaries = ref<number[]>([]);
  const summaryRecordData = computed(() => {
    return recordDetail.value?.meetingRecordDetails?.map((item) => {
      return {
        id: item?.id,
        userName: item?.username,
        speakContent: summary.contentType
          ? item?.smartContent
          : item?.originalContent,
        speakTranslationContent: summary.contentType
          ? item?.smartTranslationContent
          : item?.originalTranslationContent,
        speakTime: item?.speakEndTime - item?.speakStartTime,
      };
    });
  });
  const allCheckedUseIds = computed(() => {
    return summaryRecordData.value?.map((item) => item?.id) ?? [];
  });
  const handleCheckAllChange = () => {
    if (isSelectAll.value) {
      checkedSummaries.value = [];
    } else {
      checkedSummaries.value = allCheckedUseIds.value.slice();
    }
  };
  const isSelectAll = computed(() => {
    return allCheckedUseIds.value.length === checkedSummaries.value.length;
  });
  const handleCreateSummary = () => {
    const speakInfos = summaryRecordData.value?.filter((item) =>
      checkedSummaries.value.includes(item.id),
    );
    if (recordDetail.value) {
      const summaryData: SummaryRequest = {
        meetingRecordId: recordDetail.value.id,
        meetingNumber: recordDetail.value.meetingNumber,
        language: summary.language,
        speakInfos: speakInfos ?? [],
      };
      emits("create", summaryData);
    }
  };
  const getTranslationData = async () => {
    emits("translate", summary.language);
  };
  return {
    summary,
    value,
    languageList,
    checkedSummaries,
    summaryRecordData,
    recordDetail,
    resultLoading,
    handleCheckAllChange,
    handleCreateSummary,
    getTranslationData,
  };
};
