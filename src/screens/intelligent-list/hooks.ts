import config from "@/config";
import { handlerPathParams } from "@/utils/utils";
import { useDebounceFn, useTimeoutPoll } from "@vueuse/core";
import { ElLoading, ElMessage } from "element-plus";
import _ from "lodash";
import moment from "moment";
import { computed, h, onMounted, onUnmounted, reactive, ref } from "vue";
import { MeetingRecordUriStatus } from "../../entity/enum";
import { useNavigation } from "../../hooks/useNavigation";
import { deleteMeetingRecord, getRecordListApi } from "../../services";
import { RecordListTable } from "../../services/apis/meeting/types";
import { useAppStore } from "../../stores/useAppStore";
import { getApprovedUrls } from "../../utils/utils";
export const useAction = () => {
  const navigation = useNavigation();

  const appStore = useAppStore();

  const isDel = ref(false);

  const tableHeight = ref(0);

  const RowMeetingId = ref("");

  const inputValue = ref("");

  const selectValue = ref(0);

  let selectMeetingIds = ref<string[]>([]);

  let selectMeetingRecordIds = ref<string[]>([]);

  let tableData = ref<RecordListTable[]>([]);

  let updateIntelligentListTimer: NodeJS.Timeout | undefined = undefined;

  const pagination = reactive({
    total: 0,
    current: 1,
    pageSize: 15,
  });
  const selectKeyWords = ref([
    { label: "全部", value: 0 },
    { label: "會議主題", value: 1 },
    { label: "會議號", value: 2 },
    { label: "創建人", value: 3 },
  ]);
  const pageChange = (page: number) => {
    pagination.current = page;
    getRecordList();
  };
  const searchData = computed(() => {
    let params = {};
    switch (selectValue.value) {
      case 0:
        params = {
          keyword: inputValue.value,
        };
        break;
      case 1:
        params = {
          meetingTitle: inputValue.value,
        };
        break;
      case 2:
        params = {
          meetingNumber: inputValue.value,
        };
        break;
      case 3:
        params = {
          creator: inputValue.value,
        };
        break;
      default:
        params = {};
        break;
    }
    return params;
  });
  const getRecordList = async (showLoading = true) => {
    const loading = showLoading
      ? ElLoading.service({ fullscreen: true })
      : null;
    try {
      const { code, data, msg } = await getRecordListApi({
        ...searchData.value,
        "PageSetting.Page": pagination.current,
        "PageSetting.PageSize": pagination.pageSize,
      });
      if (code === 200) {
        pagination.total = data?.count;
        tableData.value = data?.records?.map((item) => {
          const startTime = moment(item?.startDate * 1000).format(
            "YYYY-MM-DD HH:mm:ss",
          );
          const endTime = moment(item?.endDate * 1000).format(
            "YYYY-MM-DD HH:mm:ss",
          );
          const duration = moment.duration(item?.duration * 1000);

          // 将持续时间对象转换为字符串并进行格式化
          const formattedDuration = moment
            .utc(duration.asMilliseconds())
            .format("HH:mm:ss");
          switch (item.timezone) {
            case "Asia/Shanghai":
              item.timezone = "(GMT+08:00)中國標準時間 - 北京";
              break;
            case "America/Los_Angeles":
              item.timezone = "(GMT-07:00)北美太平洋時間 - 道森";
              break;
            default:
              item.timezone = item.timezone ?? "";
              break;
          }
          return {
            ...item,
            startTime,
            endTime,
            formattedDuration,
          };
        });
      } else {
        ElMessage({
          offset: 50,
          message: msg,
          type: "error",
        });
      }
    } finally {
      loading?.close();
    }
  };

  const {
    isActive,
    pause: stopGetRecordListTimer,
    resume: getRecordListTimer,
  } = useTimeoutPoll(
    async () => {
      await getRecordList(false);
    },
    8000,
    { immediateCallback: true },
  );

  const onIntelligentDetail = (row: RecordListTable) =>
    navigation.navigate("/intelligent-detail", row);
  const delIntelligent = async (meetingRecordId: string) => {
    selectMeetingRecordIds.value = [meetingRecordId];
    isDel.value = true;
  };
  const multipleDelIntelligent = () => {
    if (selectMeetingIds.value.length > 0) {
      selectMeetingRecordIds.value = selectMeetingIds.value;
      isDel.value = true;
    } else {
      ElMessage({
        message: "錄製生成失敗",
        type: "error",
      });
    }
  };
  const cancelDel = () => {
    isDel.value = false;
  };
  const confirmDel = async () => {
    const loading = ElLoading.service({ fullscreen: true });
    try {
      const { code } = await deleteMeetingRecord(selectMeetingRecordIds.value);
      if (code === 200) {
        isDel.value = false;
        await getRecordList();
        if (tableData.value.length === 0 && pagination.current > 1) {
          pagination.current -= 1;
          getRecordList();
        }
      }
    } finally {
      loading.close();
    }
  };

  const handleDownloadVideo = async (url: string[]) => {
    const approvedUrl = await getApprovedUrls(url);

    const res = await window.electronAPI.downloadVideo(approvedUrl);

    if (!res.success) {
      throw new Error("導出失敗");
    }

    ElMessage({
      message: h("div", { style: "line-height: 1; font-size: 14px" }, [
        h("span", null, "導出成功，"),
        h(
          "span",
          {
            style: "color: teal; cursor: pointer",
            onClick: async () => {
              await window.fileSystem.openDirectory(res.directory);
            },
          },
          "查看文件",
        ),
      ]),
      type: "success",
    });
  };

  const download = async (url: string, urlStatus: number) => {
    if (!url) {
      ElMessage({
        message: "會議錄製不存在",
        type: "error",
      });

      return;
    }

    if (urlStatus === MeetingRecordUriStatus.Completed) {
      try {
        await handleDownloadVideo([url]);
      } catch (e) {
        ElMessage({
          message: "導出失敗",
          type: "error",
        });
      }
    } else if (urlStatus === MeetingRecordUriStatus.Failed) {
      ElMessage({
        message: "錄製生成失敗",
        type: "error",
      });
    } else {
      ElMessage({
        message: "錄製生成中",
        type: "success",
      });
    }
  };

  const multipleDownload = async () => {
    const urls = selectMeetingIds.value?.reduce(
      (accumulator: string[], id: string) => {
        const meetingRecord = tableData.value.find(
          (item) => item.meetingRecordId === id,
        );
        if (meetingRecord?.url) {
          accumulator.push(meetingRecord.url);
        }
        return accumulator;
      },
      [],
    );
    if (urls.length > 0) {
      try {
        await handleDownloadVideo(urls);
      } catch (e) {
        ElMessage({
          message: "導出失敗",
          type: "error",
        });
      }
    } else {
      ElMessage({
        message: "會議錄製不存在",
        type: "error",
      });
    }
  };

  const getSelectData = (val: RecordListTable[]) => {
    selectMeetingIds.value = _.uniq(val.map((item) => item.meetingRecordId));
  };
  const countHeight = () => {
    tableHeight.value = window.innerHeight - 250;
  };

  const onSearch = useDebounceFn(() => {
    if (pagination.current !== 1) {
      pagination.current = 1;

      return;
    }

    getRecordList(true);
  }, 300);

  const copyRecordLink = (row: RecordListTable) => {
    try {
      window.clipboard.writeText(
        `${config.recordShareBasicUrl}?${handlerPathParams(row)}`,
      );

      ElMessage({
        offset: 28,
        message: "已複製鏈接 ",
        type: "success",
      });
    } catch (err) {
      ElMessage({
        offset: 28,
        message: "複製失敗",
        type: "error",
      });
    }
  };

  onMounted(async () => {
    countHeight();
    window.addEventListener("resize", () => {
      countHeight();
    });
  });

  onUnmounted(() => {
    stopGetRecordListTimer();
  });
  return {
    tableData,
    appStore,
    pagination,
    isDel,
    selectKeyWords,
    selectValue,
    selectMeetingIds,
    inputValue,
    tableHeight,
    onIntelligentDetail,
    delIntelligent,
    multipleDelIntelligent,
    getSelectData,
    pageChange,
    cancelDel,
    confirmDel,
    getRecordList,
    download,
    multipleDownload,
    onSearch,
    copyRecordLink,
  };
};
