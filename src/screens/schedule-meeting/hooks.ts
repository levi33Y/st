import { get, useWindowSize } from "@vueuse/core";
import {
  ElLoading,
  ElMessage,
  ElMessageBox,
  FormInstance,
  FormRules,
} from "element-plus";
import { isEmpty, isNil } from "lodash";
import { computed, h, onMounted, reactive, ref, toRaw } from "vue";
import { useRoute } from "vue-router";
import {
  MeetingAppointmentType,
  MeetingRepeatType,
  MeetingStreamMode,
} from "../../entity/enum";
import { useNavigation } from "../../hooks/useNavigation";
import {
  createMeetingApi,
  editMeetingApi,
  getMeetingInfoApi,
  GetStaffs,
} from "../../services";
import {
  CreateMeetingRequest,
  CustomFrequencyTypeEnum,
  ICreateMeetingRequestParticipantsProps,
  MeetingTimeZoneEnum,
} from "../../services/apis/meeting/types";
import { useAppStore } from "../../stores/useAppStore";
import {
  currentTimeZoneToSelectTimeZoneTime,
  selectTimeZoneTimeToCurrentTimeZone,
} from "../../utils/utils";
import {
  IScheduleMeetingCycleFormProps,
  WeeklyOptionConst,
  WeeklyOptionEnum,
} from "../schedule-meeting-cycle/props";
import {
  ICycleProps,
  IMemberProps,
  IParticipantState,
  ISettingProps,
  IStateProps,
  ScheduleMeetingChannelMessageEnum,
  ScheduleMeetingChannelMessageProps,
} from "./props";

export const useAction = () => {
  const appStore = useAppStore();
  const { query } = useRoute();
  const meetingNumber = ref(query.meetingNumber as string);
  const IsCreateAgain = ref(query.createAgain === "true");
  const isEdit = ref<Boolean>(false);
  const navigation = useNavigation();
  const formRef = ref<FormInstance>();
  const timeOptions = ref([
    {
      label: "15分鐘",
      value: 15,
    },
    {
      label: "30分鐘",
      value: 30,
    },
    {
      label: "45分鐘",
      value: 45,
    },
    {
      label: "1小時",
      value: 60,
    },
    {
      label: "1.5小時",
      value: 90,
    },
    {
      label: "2小時",
      value: 120,
    },
    // {
    //   label: "4小時",
    //   value: 240,
    // },
    // { label: "7天", value: 10080 },
  ]);
  const timeZoneOptions = ref([
    {
      label: "(GMT-07:00)北美太平洋時間 - 道森 ",
      value: MeetingTimeZoneEnum.America,
    },
    {
      label: "(GMT+08:00)中國標準時間 - 北京 ",
      value: MeetingTimeZoneEnum.Asia,
    },
  ]);
  const cycleOptions = ref([
    {
      label: "不重複",
      value: MeetingRepeatType.None,
    },
    {
      label: "每天",
      value: MeetingRepeatType.Daily,
    },
    {
      label: "每個工作日",
      value: MeetingRepeatType.EveryWeekday,
    },
    {
      label: "每週",
      value: MeetingRepeatType.Weekly,
    },
    {
      label: "每兩周",
      value: MeetingRepeatType.BiWeekly,
    },
    {
      label: "每月",
      value: MeetingRepeatType.Monthly,
    },
    {
      label: "自定義",
      value: MeetingRepeatType.Customize,
    },
  ]);
  const scrollHeight = ref<number>(0);

  const state = reactive<IStateProps>({
    id: "",
    meetingTitle: "",
    meetingMemberList: [],
    meetingStartDate: "",
    meetingEndDate: "",
    meetingStartTime: "",
    meetingEndTime: 15,
    meetingTimeZone: "",
    meetingCycle: MeetingRepeatType.None,
    isModel: false,
  });

  const cycleState = ref<ICycleProps>({
    repeatType: MeetingRepeatType.None,
    customizeRepeatType: CustomFrequencyTypeEnum.Daily,
    repeatInterval: 1,
    repeatWeekdays: [],
    repeatMonthDays: [],
    repeatContent: "",
  });

  const settingState = reactive<ISettingProps>({
    hostList: [],
    meetingPassword: "",
    isMuted: false,
    isRecorded: false,
    isMetis: false,
    isWaitingRoomEnabled: false,
  });

  const participantState = reactive<IParticipantState>({
    participantList: [],
    isShowMeetingAllMember: false,
    meetingMemberSearch: "",
  });

  const disabledDate = (time: Date) => {
    return time.getTime() < Date.now() - 8.64e7;
  };

  const rules = reactive<FormRules>({
    meetingTitle: [
      { required: true, message: "會議主題必填", trigger: "blur" },
    ],
    meetingStartDate: [
      {
        required: true,
        validator: (rule, value, callback) => {
          if (!state.meetingStartTime) {
            callback("開始時間必填");
          } else if (+new Date(startDate.value) < +new Date()) {
            console.log(+new Date(startDate.value));

            console.log(+new Date());

            callback("開始時間不能早於當前時間");
          } else {
            callback();
          }
        },
        trigger: "blur",
      },
    ],
    meetingEndTime: [{ required: true, message: "時長必填", trigger: "blur" }],
    meetingTimeZone: [{ required: true, message: "時區必填", trigger: "blur" }],
    meetingCycle: [{ required: true, message: "週期必填", trigger: "blur" }],
    meetingMember: [
      {
        required: true,
        validator: (rule, value, callback) => {
          if (
            state.meetingMemberList.length &&
            state.meetingMemberList.length > 0
          ) {
            callback();
          } else {
            callback(new Error("參會人必填"));
          }
        },
      },
    ],
  });

  const startDate = computed(() => {
    const timeArray = state.meetingStartTime?.split(":");
    let startDate = new Date(state.meetingStartDate);
    startDate.setHours(parseInt(timeArray[0]));
    startDate.setMinutes(parseInt(timeArray[1]));
    return startDate;
  });

  const onEditMeeting = async () => {
    const result = await getMeetingInfoApi({
      meetingNumber: meetingNumber.value,
    });

    if (result.code !== 200) {
      ElMessageBox.alert(result?.msg, "無法修改", {
        confirmButtonText: "确认",
        closeOnClickModal: false,
        type: "error",
        callback: () => {
          navigation.close();
        },
      });

      return;
    }

    const {
      id,
      startDate,
      isMuted,
      isPasswordEnabled,
      meetingStreamMode,
      isRecorded,
      timeZone,
      title,
      appointmentType,
      participants,
      password,
      isMetis,
      repeatType = MeetingRepeatType.None,
      customizeRepeatType = CustomFrequencyTypeEnum.Daily,
      repeatInterval = 1,
      repeatWeekdays = [],
      repeatMonthDays = [],
      endDate,
      utilDate,
      isWaitingRoomEnabled,
    } = result?.data;

    state.id = isEdit.value ? id : "";
    state.meetingTitle = title;
    state.meetingTimeZone = timeZone;
    state.meetingStartDate = isEdit.value
      ? selectTimeZoneTimeToCurrentTimeZone(startDate * 1000, timeZone, "")
      : "";
    state.meetingStartTime = isEdit.value
      ? selectTimeZoneTimeToCurrentTimeZone(startDate * 1000, timeZone, "HH:mm")
      : "";
    state.meetingEndTime = Math.floor(endDate - startDate) / 60;
    state.meetingMemberList =
      participants
        ?.filter((item) => item?.userName !== appStore?.userInfo?.userName)
        ?.map((item) => ({
          id: item.thirdPartyUserId,
          name: item.userName ?? "",
          avatarUrl: item?.url,
        })) ?? [];
    if (repeatType === MeetingRepeatType.Customize) {
      state.meetingCycle = handleFormatCustomizeCycle({
        customizeRepeatType,
        repeatInterval,
        repeatWeekdays,
        repeatMonthDays,
      });
    } else {
      state.meetingCycle = repeatType;
    }

    settingState.hostList =
      participants
        ?.filter((item) => item.isDesignatedHost)
        ?.map((item) => ({
          id: item.thirdPartyUserId,
          name: item.userName,
        })) ?? [];
    settingState.meetingPassword = password;
    settingState.isMuted = isMuted ?? false;
    settingState.isRecorded = isRecorded;
    settingState.isMetis = isMetis;
    settingState.isWaitingRoomEnabled = isWaitingRoomEnabled;

    cycleState.value = {
      repeatType,
      customizeRepeatType,
      repeatInterval,
      repeatWeekdays,
      repeatMonthDays,
      repeatContent:
        repeatType === MeetingRepeatType.Customize
          ? (state.meetingCycle as string)
          : "",
      meetingCycleEndingTime: utilDate,
    };
  };

  const handleMemberSuggestions = (search: string, cb: any) => {
    cb(
      participantState.participantList
        ?.filter(
          (item) =>
            !search || item.name.toLowerCase().includes(search.toLowerCase()),
        )
        .map((item) => {
          const name = item.name;
          const lowerName = name.toLowerCase();
          const lowerSearch = (search ?? "").toLowerCase();
          const startIndex = lowerName.indexOf(lowerSearch);

          if (!search || startIndex === -1) {
            return { ...item, message: h("span", [item.name]) };
          }

          const endIndex = startIndex + search.length;

          const message = h("span", [
            name.slice(0, startIndex),
            h(
              "span",
              { style: { color: "var(--color-primary)" } },
              name.slice(startIndex, endIndex),
            ),
            name.slice(endIndex),
          ]);

          return { ...item, message };
        }) ?? [],
    );
  };

  const onOpenParticipantDialog = () => {
    state.isModel = true;

    const query = {
      participantList: JSON.stringify(state?.meetingMemberList ?? []),
    };

    navigation.navigate("/schedule-meeting-participant", query, {
      parent: true,
    });
  };

  const onOpenSetting = () => {
    state.isModel = true;

    const params = {
      participantList: JSON.stringify(state?.meetingMemberList ?? []),
      hostList: JSON.stringify(settingState?.hostList ?? []),
      meetingPassword: settingState.meetingPassword,
      isMuted: settingState.isMuted ? "open" : "",
      isWaitingRoomEnabled: settingState.isWaitingRoomEnabled ? "open" : "",
      isRecorded: settingState.isRecorded ? "open" : "",
      isMetis: settingState.isMetis ? "open" : "",
    };

    navigation.navigate("/schedule-meeting-setting", params, { parent: true });
  };

  const handleUpdateScroll = () => {
    const { height } = useWindowSize();

    scrollHeight.value = get(height) * 0.9 - 550;
  };

  const handleGetParticipant = async () => {
    await GetStaffs().then((res) => {
      interface types {
        id: string;
        name: string;
        avatarUrl?: string;
        value: "";
      }

      const participantList: types[] = [];

      const data = [...res.data.staffDepartmentHierarchy];

      while (data.length) {
        const node = data.pop();

        const participant =
          (node?.staffs
            ?.filter((item) => item?.userName !== appStore?.userInfo?.userName)
            ?.map((item) => ({
              id: item.id,
              name: item.userName,
              avatarUrl: item?.url,
              value: "",
            })) as types[]) ?? [];

        participant.length > 0 && participantList.push(...participant);

        if (node?.childrens && node.childrens.length > 0) {
          data.push(...node.childrens);
        }
      }

      participantState.participantList = participantList;
    });
  };

  const onSelectMemberSelect = (val: IMemberProps) => {
    const isExist = state.meetingMemberList.some((item) => item.id === val.id);

    if (isExist) {
      state.meetingMemberList = state.meetingMemberList.filter(
        (item) => item.id !== val.id,
      );
    } else {
      state.meetingMemberList.push(val);
    }
  };

  const onScheduleMeeting = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;

    await formEl.validate(async (valid) => {
      if (valid) {
        const originData = new Date(
          new Date(startDate.value).getTime() +
            Number(state.meetingEndTime) * 60 * 1000,
        );

        const endDate = currentTimeZoneToSelectTimeZoneTime(
          originData,
          state.meetingTimeZone,
        );

        const participants: ICreateMeetingRequestParticipantsProps[] =
          state.meetingMemberList.map((item) => ({
            thirdPartyUserId: item.id,
            isDesignatedHost: settingState.hostList.some(
              (host) => host.id === item.id,
            ),
          }));

        const cycleData =
          cycleState.value.repeatType !== MeetingRepeatType.Customize
            ? {
                customizeRepeatType: CustomFrequencyTypeEnum.Daily,
                repeatInterval: 1,
                repeatWeekdays: [],
                repeatMonthDays: [],
              }
            : {
                customizeRepeatType: cycleState.value.customizeRepeatType,
                repeatInterval: cycleState.value.repeatInterval,
                repeatWeekdays: cycleState.value.repeatWeekdays ?? [],
                repeatMonthDays: cycleState.value.repeatMonthDays ?? [],
              };

        const data = {
          title: state.meetingTitle,
          timeZone: state.meetingTimeZone,
          securityCode: settingState.meetingPassword,
          startDate: currentTimeZoneToSelectTimeZoneTime(
            startDate.value,
            state.meetingTimeZone,
          ),
          endDate,
          appointmentType: MeetingAppointmentType.Appointment,
          meetingStreamMode: MeetingStreamMode.MCU,
          participants,
          isMetis: settingState.isMetis,
          isMuted: settingState.isMuted,
          isWaitingRoomEnabled: settingState.isWaitingRoomEnabled,
          isRecorded: settingState.isRecorded,
          isLiveKit: true,
          ...cycleData,
          repeatType: cycleState.value.repeatType,
          utilDate: cycleState.value?.meetingCycleEndingTime
            ? new Date(cycleState.value.meetingCycleEndingTime)
            : null,
        } as CreateMeetingRequest;

        const loading = ElLoading.service({ fullscreen: true });

        try {
          const { code, msg } = isEdit.value
            ? await editMeetingApi({ id: state.id, ...data })
            : await createMeetingApi(data);

          if (code !== 200) {
            throw new Error(msg);
          }

          await window.electronAPI.sendEachWindowsMessage("/home");

          navigation.destroy("/schedule-meeting");
        } catch {
          ElMessage({
            offset: 50,
            message: "預定失敗",
            type: "error",
          });
        } finally {
          loading.close();
        }
      }
    });
  };

  const onSelectChange = async (value: MeetingRepeatType) => {
    if (value === MeetingRepeatType.Customize) {
      state.isModel = true;

      const cycleData = toRaw(cycleState.value);

      const params: IScheduleMeetingCycleFormProps = {
        frequency:
          cycleData?.customizeRepeatType ?? CustomFrequencyTypeEnum.Daily,
        cycleTimes: cycleData.repeatInterval ?? 1,
        weeklyOption: cycleData.repeatWeekdays ?? [],
        monthlyOption: cycleData.repeatMonthDays ?? [],
        endDate: cycleData?.meetingCycleEndingTime ?? "",
      };

      navigation.navigate(
        "/schedule-meeting-cycle",
        {
          cycleData: JSON.stringify(params),
        },
        {
          parent: true,
        },
      );
    } else {
      cycleState.value.repeatType = value;
    }
  };

  const handleFormatCustomizeCycle = (
    data: Required<
      Pick<
        CreateMeetingRequest,
        | "customizeRepeatType"
        | "repeatInterval"
        | "repeatWeekdays"
        | "repeatMonthDays"
      >
    >,
  ) => {
    let cycle = "";

    let times = data.repeatInterval > 1 ? data.repeatInterval : "";

    switch (data.customizeRepeatType) {
      case CustomFrequencyTypeEnum.Daily:
        cycle = `每${times}天重複`;
        break;
      case CustomFrequencyTypeEnum.Weekly:
        cycle = `每${times}周的${data.repeatWeekdays
          ?.map(
            (option: WeeklyOptionEnum) =>
              WeeklyOptionConst?.find((item) => item?.value === option)?.label,
          )
          ?.join("、")}重複`;
        break;
      case CustomFrequencyTypeEnum.Monthly:
        cycle = `每${times}月的${data.repeatMonthDays?.join("、")}日重複`;
        break;
    }

    return cycle;
  };

  const handleUpdateChannelMessage = (
    data?: ScheduleMeetingChannelMessageProps,
  ) => {
    if (isNil(data)) return;

    switch (data.type) {
      case ScheduleMeetingChannelMessageEnum.ScheduleMeetingParticipant:
        state.meetingMemberList = data?.content
          ? data?.content
          : ([] as {
              id: string;
              name: string;
            }[]);

        break;
      case ScheduleMeetingChannelMessageEnum.ScheduleMeetingSetting:
        if (isNil(data.content) || isEmpty(data.content)) {
          return;
        }

        const {
          hostList = [],
          meetingPassword = "",
          isMuted = false,
          isRecorded = false,
          isMetis = false,
          isWaitingRoomEnabled = false,
        } = data.content;

        settingState.hostList = hostList;

        settingState.meetingPassword = meetingPassword;

        settingState.isMuted = isMuted;

        settingState.isWaitingRoomEnabled = isWaitingRoomEnabled;

        settingState.isRecorded = isRecorded;

        settingState.isMetis = isMetis;

        break;
      case ScheduleMeetingChannelMessageEnum.ScheduleMeetingCycle:
        if (!data?.content) {
          state.meetingCycle =
            cycleState.value.repeatType === MeetingRepeatType.Customize
              ? cycleState.value.repeatContent
              : cycleState.value.repeatType;
        } else {
          const cycleData = data.content as IScheduleMeetingCycleFormProps;

          const cycleContent = handleFormatCustomizeCycle({
            customizeRepeatType: cycleData.frequency,
            repeatInterval: cycleData.cycleTimes,
            repeatWeekdays: cycleData.weeklyOption,
            repeatMonthDays: cycleData.monthlyOption,
          });

          cycleState.value = {
            repeatType: MeetingRepeatType.Customize,
            customizeRepeatType: cycleData.frequency,
            repeatInterval: cycleData?.cycleTimes ?? 1,
            repeatWeekdays:
              cycleData.frequency === CustomFrequencyTypeEnum.Weekly
                ? cycleData?.weeklyOption ?? []
                : [],
            repeatMonthDays:
              cycleData.frequency === CustomFrequencyTypeEnum.Monthly
                ? cycleData?.monthlyOption ?? []
                : [],
            repeatContent: cycleContent,
            meetingCycleEndingTime: cycleData?.endDate,
          };

          state.meetingCycle = cycleContent;
        }

        break;
    }
  };

  onMounted(async () => {
    const loading = ElLoading.service({
      fullscreen: true,
    });

    handleUpdateScroll();

    try {
      await handleGetParticipant();

      if (query?.meetingNumber) {
        if (query.createAgain === "false") {
          isEdit.value = true;
        }
        await onEditMeeting();
      }
    } finally {
      loading.close();
    }

    window.onresize = (_) => handleUpdateScroll();
  });

  onMounted(() => {
    window.channelMessaging.onGiveMessage();

    window.onmessage = (e) => {
      if (e.data === "main-give-message") {
        const [port] = e.ports;

        port.onmessage = (e) => {
          handleUpdateChannelMessage(e?.data);
        };
      }

      state.isModel = false;
    };
  });

  return {
    formRef,
    participantState,
    isEdit,
    rules,
    state,
    cycleState,
    timeOptions,
    timeZoneOptions,
    cycleOptions,
    disabledDate,
    scrollHeight,
    onScheduleMeeting,
    handleMemberSuggestions,
    onOpenParticipantDialog,
    onOpenSetting,
    onSelectMemberSelect,
    onSelectChange,
  };
};
