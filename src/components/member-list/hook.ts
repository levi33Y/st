import { ElMessage } from "element-plus";
import { isEmpty } from "lodash";
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useAppStore } from "../../stores/useAppStore";
import { useMeetingStore } from "../../stores/useMeetingStore";
import MemberListMicrophone from "./member-list-microphone.vue";
import {
  IDialogFormStateProps,
  IProps,
  IStateProps,
  MeetingParticipant,
  MemberListTabEnum,
} from "./props";

export const useAction = (props: IProps) => {
  const appStore = useAppStore();

  const meetingStore = useMeetingStore();

  const state = reactive<IStateProps>({
    isFocus: false,
    isDropdownVisible: false,
    searchName: "",
    loading: false,
    tabStatus: MemberListTabEnum.Meeting,
  });

  const dialogState = reactive<IDialogFormStateProps>({
    dialogVisible: false,
    name: "",
  });

  const participantList = ref<MeetingParticipant[]>([]);

  const userItemRefs = ref<HTMLDivElement[]>([]);

  const optionMicrophoneRefs = ref<InstanceType<typeof MemberListMicrophone>[]>(
    [],
  );

  const optionUserRefs = ref<HTMLDivElement[]>([]);

  const localRole = computed(() =>
    meetingStore.getRole(appStore.userInfo.id + ""),
  );

  const isCreator = computed(() =>
    meetingStore.isCreator(appStore.userInfo.id + ""),
  );

  const onHoverUserItem = (index: number) => {
    userItemRefs.value?.at(index) &&
      (userItemRefs.value.at(index)!.style.backgroundColor = "#F8F8FF");

    optionMicrophoneRefs.value?.at(index) &&
      optionMicrophoneRefs.value.at(index)?.onShow(false);

    optionUserRefs.value?.at(index)?.style &&
      (optionUserRefs.value.at(index)!.style.display = "flex");
  };

  const onLeaverUserItem = (index: number) => {
    if (state.isDropdownVisible) return;

    nextTick(() => {
      userItemRefs.value?.at(index) &&
        (userItemRefs.value.at(index)!.style.backgroundColor = "transparent");

      optionMicrophoneRefs.value?.at(index) &&
        optionMicrophoneRefs.value.at(index)?.onShow(true);

      optionUserRefs.value?.at(index)?.style &&
        (optionUserRefs.value.at(index)!.style.display = "none");
    });
  };

  const onEditUsername = (index: number) => {
    if (!participantList.value.at(index)) {
      return ElMessage({
        message: "对象不存在！",
        type: "error",
      });
    }

    dialogState.dialogVisible = true;

    dialogState.index = index;

    dialogState.name = participantList.value.at(index)?.name ?? "";
  };

  watch(
    [
      () => props.streamList,
      () => state.searchName,
      () => props.meetingPermission,
    ],
    () => {
      participantList.value =
        (props.streamList
          ?.filter((item) => {
            if (isEmpty(state.searchName)) return true;

            const itemName = item.name?.toLowerCase() || "";

            const searchKey = state.searchName.toLowerCase();

            return itemName.includes(searchKey);
          })
          ?.map((item) => ({
            ...item,
            role: props.meetingPermission.get(item.id + ""),
          })) as MeetingParticipant[]) ?? [];
    },
    {
      immediate: true,
      deep: true,
    },
  );

  return {
    appStore,
    state,
    dialogState,
    participantList,
    userItemRefs,
    isCreator,
    localRole,
    optionMicrophoneRefs,
    optionUserRefs,
    onEditUsername,
    onHoverUserItem,
    onLeaverUserItem,
  };
};
