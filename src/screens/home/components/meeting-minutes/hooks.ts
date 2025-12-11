import { useMessage } from "@/hooks/useMessage";
import { existsWindow } from "@/utils/utils";
import { ElLoading, ElMessage } from "element-plus";
import { LoadingInstance } from "element-plus/es/components/loading/src/loading";
import _, { debounce, isEmpty, isNil } from "lodash";
import moment from "moment";
import {
  nextTick,
  onBeforeMount,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  toRaw,
} from "vue";
import { MeetingStatus, MeetingStreamMode } from "../../../../entity/enum";
import { MeetingAppointmentRecord } from "../../../../entity/types";
import { StoreEventEnum, useNavigation } from "../../../../hooks/useNavigation";
import {
  cancelAppointmentMeeting,
  getAppointmentMeetingList,
  getMeetingInfoApi,
} from "../../../../services";
import { useAppStore } from "../../../../stores/useAppStore";
import { scheduleListStore } from "../../../../stores/useScheduleStore";
import { formatTimestampWithTimezone } from "../../../../utils/moment";

interface initMinutesList {
  formattedDate: string;
  meetingScheduleData: MeetingAppointmentRecord[];
}

const roomPage = "/trtc-room";

export const useAction = () => {
  const appStore = useAppStore();
  const scheduleStore = scheduleListStore();
  const navigation = useNavigation();
  const { messageServices } = useMessage();
  const paramsData = reactive({
    Page: 1,
    PageSize: 10,
  });
  const state = reactive({
    autoAudio: true,
    microphone: false,
    enableCamera: false,
    userName: appStore.userName,
    isDropdownVisible: false,
  });
  const meetingScheduleList = ref<initMinutesList[]>([]);

  const hoverButtonRefs = ref<any[]>([]);

  const meetingMessageRefs = ref<any[]>([]);

  const loadingService = ref<LoadingInstance | null>(null);

  let updateMinutesListTimer: NodeJS.Timeout | undefined = undefined;

  const ScheduleListCount = reactive({
    totalCount: 0,
    isMeet: false,
  });
  const scrollContainer = ref();
  const getStatusContent = (status: number) => {
    switch (status) {
      case MeetingStatus.Pending:
        return {
          style: {
            background: "#F49019",
            color: "#FFFFFF",
          },
          text: "待開始",
        };
      case MeetingStatus.InProgress:
        return {
          style: {
            background: "#4966FF",
            color: "#FFFFFF",
          },
          text: "進行中",
        };
      case MeetingStatus.Completed:
        return {
          style: { background: "#DDDDE9", color: "#737489" },
          text: "已結束",
        };
      case MeetingStatus.Cancelled:
        return {
          style: { background: "#DDDDE9", color: "#737489" },
          text: "已取消",
        };
    }
  };

  const meetingMinutesList = async (
    page: number = paramsData.Page,
    pageSize: number = paramsData.PageSize,
  ) => {
    const result = await getAppointmentMeetingList(
      page,
      pageSize,
      moment().format("YYYY-MM-DD"),
    );
    if (result.code === 200) {
      ScheduleListCount.totalCount = result?.data?.count;

      ScheduleListCount.isMeet =
        result?.data?.records.length === result?.data?.count ||
        result?.data?.records.length === 0;

      const initData = initMinutesList(result?.data?.records);
      if (meetingScheduleList.value.length === 0) {
        meetingScheduleList.value.push(...initData);
      } else {
        initData.forEach((item) => {
          const index = meetingScheduleList.value.findIndex(
            (i) => i?.formattedDate === item?.formattedDate,
          );
          if (index !== -1) {
            let scheduleData =
              meetingScheduleList.value[index]?.meetingScheduleData ?? [];

            item?.meetingScheduleData?.forEach((schedule) => {
              let isHasSchedule = scheduleData.findIndex(
                (rawSchedule) => rawSchedule.meetingId === schedule.meetingId,
              );

              if (isHasSchedule === -1) {
                scheduleData.push(schedule);
              } else {
                scheduleData[isHasSchedule] = schedule;
              }
            });

            meetingScheduleList.value[index].meetingScheduleData = scheduleData;
          } else {
            meetingScheduleList.value.push(item);
          }
        });
      }
      scheduleStore.scheduleList = _.cloneDeep(meetingScheduleList.value);
    }
  };

  const handleUpdateMeetingScheduleList = () => {
    meetingScheduleList.value = [];

    meetingMinutesList(1, paramsData.Page * paramsData.PageSize);
  };

  const handleRemoveElement = (index: number, scheduleIndex: number) => {
    scheduleStore.deleteItem(index, scheduleIndex);

    nextTick(() => {
      meetingMessageRefs.value.pop();

      hoverButtonRefs.value.pop();
    });
  };

  const initMinutesList = (data: MeetingAppointmentRecord[]) => {
    const newRecords = data?.reduce((res, item) => {
      const date = moment(item?.startDate * 1000).format("YYYY-MM-DD");
      const formattedStartTime = moment(item?.startDate * 1000).format("HH:mm");
      const formattedEndTime = moment(item?.endDate * 1000).format("HH:mm");
      const result = res.find(
        (obj) =>
          obj?.formattedDate ===
          formatTimestampWithTimezone(item?.startDate, item?.timeZone),
      );
      item.durationTime = `${formattedStartTime} - ${formattedEndTime}`;
      if (result) {
        result.meetingScheduleData.push(item);
      } else {
        res.push({
          formattedDate: formatTimestampWithTimezone(item?.startDate),
          meetingScheduleData: [item],
        });
      }
      return res;
    }, [] as initMinutesList[]);

    return newRecords;
  };
  const onEditMeeting = (meetingNumber: string) => {
    navigation.navigate("/schedule-meeting", {
      meetingNumber,
      createAgain: false,
    });
  };
  const openInvite = (meetingId: string) => {
    navigation.navigate("/invite", { meetingId });
  };
  const joinMeeting = async (meetingNumber: string) => {
    loadingService.value = ElLoading.service({ fullscreen: true });

    const isHas = await existsWindow(roomPage);

    if (isHas) {
      loadingService.value?.close();

      return;
    }

    try {
      if (isNil(meetingNumber) || isEmpty(meetingNumber)) {
        throw "meetingNumber is Null";
      }

      const { code, data, msg } = await getMeetingInfoApi({
        meetingNumber: meetingNumber,
        includeUserSession: false,
      });

      if (
        data.meetingMasterUserId + "" != appStore.userInfo.id + "" &&
        data.createdBy + "" != appStore.userInfo.id + "" &&
        data.isLocked
      ) {
        loadingService.value?.close();

        messageServices("會議已鎖定，如需加入請聯繫主持人。");

        return;
      }

      navigation.navigate(roomPage, {
        ...state,
        meetingNumber,
        isMuted: !state.microphone,
        meetingStreamMode: MeetingStreamMode.SFU,
      });
    } catch (error) {
      loadingService.value?.close();

      ElMessage({
        message: "入會失敗",
        type: "error",
      });
    }
  };
  const handleScroll = debounce(() => {
    const isScrollToBottom =
      scrollContainer.value.scrollHeight -
        scrollContainer.value.scrollTop -
        10 <
      scrollContainer.value.clientHeight;

    if (isScrollToBottom && !ScheduleListCount.isMeet) {
      meetingMinutesList(paramsData.Page + 1, paramsData.PageSize).then(() => {
        paramsData.Page += 1;
      });
    }
  }, 300);

  const cancelMeetingMinute = async (
    index: number,
    scheduleIndex: number,
    meetingId: string,
  ) => {
    const loading = ElLoading.service({ fullscreen: true });
    const { code } = await cancelAppointmentMeeting(meetingId);
    try {
      if (code === 200) {
        handleRemoveElement(index, scheduleIndex);

        ElMessage({
          message: "操作成功",
          type: "success",
          customClass: "center-el-message",
        });
      } else {
        ElMessage({
          message: "操作失敗",
          type: "error",
          customClass: "center-el-message",
        });
      }
    } finally {
      loading.close();
    }
  };

  const getMinutesListTimer = () => {
    stopGetMinutesListTimer();
    updateMinutesListTimer = setInterval(() => {
      handleUpdateMeetingScheduleList();
    }, 43200000);
  };

  const stopGetMinutesListTimer = () => {
    clearInterval(updateMinutesListTimer);
    updateMinutesListTimer = undefined;
  };

  const onCopyMeeting = (meetingNumber: string) => {
    window.clipboard.writeText(`#${appStore.appInfo.name}：${meetingNumber}`);
    ElMessage({
      offset: 28,
      message: "已複製到粘貼板",
      type: "success",
    });
  };

  const onOpenMeetingListDetail = (meetingId: string) => {
    navigation.navigate("/schedule-meeting-detail", { meetingId });
  };

  const onMeetingItemOption = (id: string, status: "hover" | "leaver") => {
    const index =
      toRaw(scheduleStore?.scheduleList)
        ?.map((item) => item?.meetingScheduleData)
        ?.flat(1)
        ?.findIndex((item) => item!.meetingId == id) ?? -1;

    if (
      index === -1 ||
      isNil(meetingMessageRefs?.value?.at(index)?.style) ||
      isNil(hoverButtonRefs?.value?.at(index)?.style)
    )
      return;

    nextTick(() => {
      if (status === "hover") {
        hoverButtonRefs.value?.forEach((item, i) => {
          item && (item.style.display = index === i ? "flex" : "none");
        });

        meetingMessageRefs.value?.forEach((item, i) => {
          item && (item.style.background = index === i ? "#F5F5FF" : "inherit");
        });
      } else if (status === "leaver" && !state.isDropdownVisible) {
        hoverButtonRefs.value!.at(index) &&
          (hoverButtonRefs.value!.at(index).style.display = "none");

        meetingMessageRefs.value!.at(index) &&
          (meetingMessageRefs.value!.at(index).style.background = "inherit");
      }
    });
  };

  const updateTimeStatus = setInterval(() => {
    scheduleStore.scheduleList?.forEach((item) => {
      item?.meetingScheduleData?.forEach((meetingItem) => {
        if (
          meetingItem.endDate * 1000 < Date.now() &&
          !appStore.isMeeting &&
          meetingItem.status !== MeetingStatus.Cancelled
        ) {
          meetingItem.status = MeetingStatus.Completed;
        }
        if (
          meetingItem.startDate * 1000 < Date.now() &&
          meetingItem.endDate * 1000 > Date.now() &&
          !appStore.isMeeting &&
          meetingItem.status !== MeetingStatus.Cancelled &&
          meetingItem.status !== MeetingStatus.Completed
        ) {
          meetingItem.status = MeetingStatus.InProgress;
        }
      });
    });
  }, 200);

  // onMounted(() => {
  //   nextTick(() => {
  //     getMinutesListTimer()
  //     window.electronAPI.sendEachWindows(() => {
  //       handleUpdateMeetingScheduleList()
  //     })
  //   })
  // })

  onUnmounted(() => {
    clearInterval(updateTimeStatus);
    clearInterval(updateMinutesListTimer);
    scheduleStore.scheduleList = [];
  });

  onBeforeMount(() => {
    scheduleStore.scheduleList = [];
  });

  onMounted(() => {
    navigation.on(StoreEventEnum.RoomPageReady, () => {
      loadingService.value?.close();
    });
  });

  return {
    state,
    hoverButtonRefs,
    meetingMessageRefs,
    meetingScheduleList,
    scrollContainer,
    scheduleStore,
    meetingMinutesList,
    handleScroll,
    onEditMeeting,
    openInvite,
    joinMeeting,
    getStatusContent,
    cancelMeetingMinute,
    onCopyMeeting,
    onOpenMeetingListDetail,
    onMeetingItemOption,
    handleUpdateMeetingScheduleList,
  };
};
