import _ from "lodash";
import moment from "moment";
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { MeetingHistoryListData } from "../../entity/types";
import { useNavigation } from "../../hooks/useNavigation";
import { getHistoryMeetingList } from "../../services";
import { useAppStore } from "../../stores/useAppStore";
interface DateItem {
  historyMonth: string;
  historyYear: string;
  key: string;
  historyMeetingsContent: MeetingHistoryListData[];
}
export const useAction = () => {
  const navigation = useNavigation();
  const searchMeeting = ref("");
  const appStore = useAppStore();
  const paramsData = reactive({
    Page: 1,
    PageSize: 6,
  });
  const scrollContainer = ref();
  const historyMeetListCount = reactive({
    totalCount: 0,
    MeetListLength: 0,
  });
  let historyMeetList = ref<DateItem[]>([]);
  const searchMeetListData = ref<DateItem[]>([]); //搜索的数据
  const initMeetListData = ref<MeetingHistoryListData[]>([]); //原始数据
  const onReserveMeeting = () => {
    // TO DO
  };
  const lastMeetListData = computed(() => {
    return searchMeeting.value
      ? searchMeetListData.value
      : historyMeetList.value;
  });
  const onMeetingDetail = (meetingDetail: MeetingHistoryListData) =>
    navigation.navigate("/history-meeting-detail", {
      ...meetingDetail,
      attendees: JSON.stringify(meetingDetail.attendees),
    });
  const searchMeetingChange = _.debounce(async () => {
    const result = await getHistoryMeetingList(searchMeeting.value);
    if (result.code === 200) {
      searchMeetListData.value = initMeetList(result?.meetingHistoryList);
    }
  }, 200);
  const meetingHistoryList = async (
    page: number = paramsData.Page,
    pageSize: number = paramsData.PageSize,
  ) => {
    const result = await getHistoryMeetingList(undefined, page, pageSize);
    if (result.code === 200) {
      historyMeetListCount.totalCount = result?.totalCount;
      historyMeetListCount.MeetListLength = result?.meetingHistoryList.length;
      initMeetListData.value.push(...result?.meetingHistoryList);
      const testData = initMeetList(result?.meetingHistoryList);
      //檢查分頁獲取後日期有沒有重複的
      if (historyMeetList.value.length === 0) {
        historyMeetList.value.push(...testData);
      } else {
        testData.forEach((item) => {
          const index = historyMeetList.value.findIndex(
            (i) => i?.key === item?.key,
          );
          if (index !== -1) {
            historyMeetList.value[index].historyMeetingsContent.push(
              ...item.historyMeetingsContent,
            );
          } else {
            historyMeetList.value.push(item);
          }
        });
      }
    }
  };
  const initMeetList = (data: MeetingHistoryListData[]) => {
    const testData = data?.reduce((res, item) => {
      const date = moment(item?.startDate * 1000).format("YYYY-MM-DD");
      const dateArray = date.split("-");
      const year = dateArray[0];
      const month = dateArray[1];
      const day = dateArray[2];
      const historyMonth = `${month}月${day}日`;
      const historyYear = `${year}年`;
      const result = res.find((obj) => obj.key === date);
      item.title = item?.title ?? `${item?.meetingCreator}的快速會議`;
      if (result) {
        result.historyMeetingsContent.push(item);
      } else {
        res.push({
          key: date,
          historyMonth: historyMonth,
          historyYear: historyYear,
          historyMeetingsContent: [item],
        });
      }
      return res;
    }, [] as DateItem[]);
    return testData;
  };
  const handleScroll = () => {
    const isTotalCount = historyMeetListCount.MeetListLength === 0;
    if (!isTotalCount && searchMeeting.value === "") {
      // 触发滚动到底部时的逻辑
      paramsData.Page += 1;
      meetingHistoryList();
    }
  };
  onMounted(() => {
    window.electronAPI.sendEachWindows(() => {
      historyMeetList.value = [];

      if (searchMeeting.value) {
        searchMeetingChange();
        meetingHistoryList(1, paramsData.Page * paramsData.PageSize);
      } else {
        meetingHistoryList(1, paramsData.Page * paramsData.PageSize);
      }
    });
    nextTick(() => {
      meetingHistoryList();
    });
  });
  return {
    onReserveMeeting,
    handleScroll,
    historyMeetList,
    searchMeeting,
    scrollContainer,
    searchMeetingChange,
    lastMeetListData,
    onMeetingDetail,
  };
};
