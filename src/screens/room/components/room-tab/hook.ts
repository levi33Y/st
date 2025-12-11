import { get, useWindowSize } from "@vueuse/core";
import { Ref, ref } from "vue";
import { IEditableTabsProps, IRoomTabItemProps, TabsEnum } from "./props";

export const useAction = (modelValue: Ref<TabsEnum | null>) => {
  const editableTabs = ref<IEditableTabsProps[]>([]);
  const onTabsRemove = async (targetName: TabsEnum) => {
    if (editableTabs.value.length === 1) {
      switch (targetName) {
        case TabsEnum.MemberList:
          updateWindow(-387);
          break;
        default:
          break;
      }

      editableTabs.value = [];

      modelValue.value = null;
    } else {
      const target = editableTabs.value.findIndex(
        (item) => item.name === targetName,
      );

      editableTabs.value = editableTabs.value.filter(
        (_, index) => index !== target,
      );

      modelValue.value =
        target === 0
          ? editableTabs.value[target + 1]?.name
          : editableTabs.value[target - 1]?.name;
    }
  };

  const onTabsOpen = async ({ name: targetName, title }: IRoomTabItemProps) => {
    if (
      editableTabs.value.findIndex((item) => item.name === targetName) === -1
    ) {
      if (editableTabs.value.length === 0) {
        switch (targetName) {
          case TabsEnum.MemberList:
            await updateWindow(387);
            break;
          default:
            break;
        }

        editableTabs.value.push({
          title: title,
          name: targetName,
        });

        modelValue.value = targetName;
      }
    } else {
      onTabsRemove(targetName);
    }
  };

  const handleUpdateTabsTitle = ({
    name: targetName,
    title,
  }: IRoomTabItemProps) => {
    if (
      editableTabs.value.findIndex((item) => item.name === targetName) === -1
    ) {
      return;
    }

    const newTableTabs = [...editableTabs.value].map((item) => ({
      ...item,
      title: item.name === targetName ? title : item.title,
    }));

    editableTabs.value = newTableTabs;
  };

  const updateWindow = async (...arg: number[]) => {
    const { width, height } = useWindowSize();

    const subWidth = arg?.at(0) ?? 0;

    const subHeight = arg?.at(1) ?? 0;

    await window.windowControl.setSize(
      "/room",
      [get(width) + subWidth, get(height) + subHeight],
      {
        minWidth: 960 + (subWidth > 0 ? subWidth : 0),
        minHeight: 640 + (subHeight > 0 ? subHeight : 0),
      },
    );
  };

  return {
    editableTabs,
    handleUpdateTabsTitle,
    onTabsRemove,
    onTabsOpen,
  };
};
