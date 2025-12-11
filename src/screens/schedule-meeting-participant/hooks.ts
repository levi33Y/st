import { watchDebounced } from "@vueuse/core";
import { ElLoading, ElTree } from "element-plus";
import type { TreeKey } from "element-plus/es/components/tree/src/tree.type";
import { isNil } from "lodash";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { GetStaffs } from "../../services";
import { IStaffsStaffDepartmentHierarchyProps } from "../../services/apis/meeting/types";
import { useAppStore } from "../../stores/useAppStore";
import {
  IMemberProps,
  ScheduleMeetingChannelMessageEnum,
  ScheduleMeetingChannelMessageProps,
} from "../schedule-meeting/props";
import { ITreeDataProps } from "./props";
export const useAction = () => {
  const appStore = useAppStore();

  const { query } = useRoute();

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
      const { data } = await GetStaffs();

      const _loop = (nodes: IStaffsStaffDepartmentHierarchyProps[]) => {
        const dataNodes: ITreeDataProps[] = [];

        nodes.forEach((node: IStaffsStaffDepartmentHierarchyProps) => {
          const dataNode: ITreeDataProps = {
            id: node.department.id,
            label: node.department.name,
            isStaff: false,
            children:
              node.staffs
                ?.filter((item) => item.userName !== appStore.userInfo.userName)
                ?.map((item) => {
                  console.log(item.url);

                  return {
                    id: item.id,
                    label: item.userName,
                    isStaff: true,
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

      const participantList = (
        query?.participantList
          ? JSON.parse(query.participantList as string)
          : []
      ) as IMemberProps[];

      formListData.value =
        participantList?.map((item) => ({
          id: item.id,
          label: item.name,
          isStaff: true,
          avatarUrl: item?.avatarUrl ?? "",
        })) ?? [];

      const keys = (participantList.map((item) => item.id) ?? []) as TreeKey[];

      treeRef?.value?.setCheckedKeys(keys, true);
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
  };
};
