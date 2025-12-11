import { StoreEventEnum, useNavigation } from "@/hooks/useNavigation";
import { watchDebounced } from "@vueuse/core";
import { ElLoading, ElMessage, ElTree } from "element-plus";
import type { TreeKey } from "element-plus/es/components/tree/src/tree.type";
import { isNil } from "lodash";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { getInviteUsers, inviteCreate } from "../../services";
import { IInviteStaffsStaffDepartmentHierarchyProps } from "../../services/apis/meeting/types";
import { useAppStore } from "../../stores/useAppStore";
import {
  ScheduleMeetingChannelMessageEnum,
  ScheduleMeetingChannelMessageProps,
} from "../schedule-meeting/props";
import { ITreeDataProps } from "./props";
export const useAction = () => {
  const appStore = useAppStore();

  const { query } = useRoute();

  const navigation = useNavigation();

  const treeRef = ref<InstanceType<typeof ElTree>>();

  const treeFilterValue = ref<string>("");

  const formListData = ref<Omit<ITreeDataProps, "children">[]>([]);

  const treeData = ref<ITreeDataProps[]>([]);

  const formData = computed<ScheduleMeetingChannelMessageProps>(() => ({
    type: ScheduleMeetingChannelMessageEnum.ScheduleMeetingParticipant,
    content: formListData.value
      .filter((item) => item.isStaff)
      .map((item) => ({
        id: item.id,
        name: item.label,
      })),
  }));

  const handleFilterNode = (value: string, data: ITreeDataProps) => {
    return (
      isNil(value) || data.label?.toLowerCase()?.includes(value?.toLowerCase())
    );
  };

  const onCancelListItem = (id: string) => {
    formListData.value = formListData.value.filter((item) => item.id !== id);

    const keys = (formListData.value.map((item) => item.id) ?? []) as TreeKey[];

    treeRef?.value?.setCheckedKeys(keys, true);
  };

  const onClose = () => {
    navigation.destroy("/meeting-invitation-confirm");
  };

  const onConfirm = async () => {
    const loading = ElLoading.service({ fullscreen: true });

    try {
      const names =
        formListData.value
          ?.filter((item) => item.isStaff)
          ?.map((item) => item.label) ?? [];

      await inviteCreate({
        meetingId: query.meetingId as string,
        meetingSubId: query.meetingSubId as string,
        names: names,
      });

      navigation.emit(StoreEventEnum.UpdateMeetingPermission);

      onClose();
    } catch (error) {
      ElMessage.error("邀请失败");
    } finally {
      loading.close();
    }
  };

  watchDebounced(
    treeFilterValue,
    () => {
      treeRef?.value?.filter(treeFilterValue.value);
    },
    { debounce: 300 },
  );

  onMounted(async () => {
    const loading = ElLoading.service({ fullscreen: true });

    try {
      const { data } = await getInviteUsers(
        query.meetingId as string,
        query.meetingSubId as string,
      );

      const _loop = (nodes: IInviteStaffsStaffDepartmentHierarchyProps[]) => {
        const dataNodes: ITreeDataProps[] = [];

        nodes.forEach((node: IInviteStaffsStaffDepartmentHierarchyProps) => {
          const dataNode: ITreeDataProps = {
            id: node.department.id,
            label: node.department.name,
            isStaff: false,
            children:
              node.staffs
                ?.filter((item) => item.userName !== appStore.userInfo.userName)
                ?.map((item) => {
                  // 如果 meetingStaffStatus 为 0（已入会），则设为禁用状态
                  const isDisabled = item.meetingStaffStatus === 0;

                  return {
                    id: item.id,
                    label: item.userName,
                    isStaff: true,
                    disabled: isDisabled,
                    avatarUrl: item?.url ?? "",
                  };
                }) ?? [],
          };

          if (node?.childrens && node.childrens.length > 0) {
            dataNode.children!.push(..._loop(node.childrens));
          }

          dataNodes.push(dataNode);
        });

        return dataNodes;
      };

      treeData.value = _loop(data?.staffDepartmentHierarchy ?? []);
    } finally {
      loading.close();
    }
  });

  return {
    treeRef,
    treeFilterValue,
    formListData,
    treeData,
    formData,
    handleFilterNode,
    onCancelListItem,
    onClose,
    onConfirm,
  };
};
