import { OnlineTypeEnum } from "@/entity/response";
import { confirm } from "@/screens/trtc-room/components/member-list/utlis";
import { IUserInfoProps } from "@/utils/trtc/store/room";
import { isEmpty } from "lodash";
import { computed, nextTick, reactive, ref } from "vue";
import { useAppStore } from "../../../../stores/useAppStore";
import MemberListMicrophone from "./member-list-microphone.vue";
import {
  IDataEventProps,
  IDialogFormStateProps,
  IEmitsProps,
  IManagementMemberProps,
  IProps,
  IStateProps,
  MemberListEventEnum,
  MemberListTabEnum,
} from "./props";

export const useAction = (props: IProps, emits: IEmitsProps) => {
  const appStore = useAppStore();

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

  const userItemRefs = ref<HTMLDivElement[]>([]);

  const optionMicrophoneRefs = ref<InstanceType<typeof MemberListMicrophone>[]>(
    [],
  );

  const optionUserRefs = ref<HTMLDivElement[]>([]);

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

  const searchParticipant = computed(() => {
    const _filterBySearchKey = (userName: string): boolean => {
      if (isEmpty(state.searchName)) return true;

      const itemName = userName?.toLowerCase() ?? "";

      const searchKey = state.searchName.toLowerCase();

      return itemName.includes(searchKey);
    };

    let result = [];

    switch (state.tabStatus) {
      case MemberListTabEnum.Wait: {
        result = props.streamList.filter(
          (item) =>
            _filterBySearchKey(item.name) &&
            item.status === OnlineTypeEnum.Waiting &&
            props.waitingRoomUserSessions.some(
              (waitUser) => waitUser.userId + "" == item.id + "",
            ),
        );
        break;
      }
      case MemberListTabEnum.Meeting: {
        result = props.streamList.filter(
          (item) =>
            _filterBySearchKey(item.name) &&
            item.status === OnlineTypeEnum.Online,
        );

        break;
      }
      case MemberListTabEnum.NoJoin: {
        result = props.noJoinMeetingUsers
          .filter((item) => _filterBySearchKey(item.userName))
          .map((item) => ({
            ...item,
            name: item.userName,
            nick: item.userName,
            avatarUrl: item?.url,
          }));

        break;
      }
    }

    return result;
  });

  const localParticipant = computed(
    () =>
      props.streamList.find((item) => item.isLocal) ?? ({} as IUserInfoProps),
  );

  const onSubmit = (data: IDataEventProps) => {
    let message = "",
      title = "",
      confirmButtonText = "確認",
      cancelButtonText = "取消";

    switch (data.type) {
      case MemberListEventEnum.AllAccess: {
        title = "准入等候成員";
        message = "是否允許等候室所有成員加入會議";
        confirmButtonText = "全部准入";
        break;
      }
      case MemberListEventEnum.AllRemove: {
        title = "移除等候成員";
        message = "將等候室的所有成員都移除？";
        confirmButtonText = "全部移除";
        break;
      }
      default: {
        break;
      }
    }

    if (message) {
      confirm(
        {
          message,
          title,
          confirmButtonText,
          cancelButtonText,
        },
        () => {
          emits("dataEvent", data);
        },
      );
    } else {
      emits("dataEvent", data);
    }
  };

  const onCall = async (data: IManagementMemberProps) => {
    emits("dataEvent", {
      type: MemberListEventEnum.Call,
      data: data,
    });
  };

  return {
    appStore,
    state,
    dialogState,
    searchParticipant,
    userItemRefs,
    localParticipant,
    optionMicrophoneRefs,
    optionUserRefs,
    onHoverUserItem,
    onLeaverUserItem,
    onSubmit,
    onCall,
  };
};
