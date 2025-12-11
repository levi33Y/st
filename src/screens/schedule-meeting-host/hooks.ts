import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "../../stores/useAppStore";
import { IMemberProps } from "../schedule-meeting/props";

export const useAction = () => {
  const { query } = useRoute();

  const searchValue = ref<string>("");

  const appStore = useAppStore();

  const formListData = ref<
    {
      id: string;
      name: string;
    }[]
  >([]);

  const participantList = ref<
    {
      id: string;
      name: string;
      value: boolean;
    }[]
  >([]);

  const participantFilter = computed(
    () =>
      participantList.value?.filter(
        (item) =>
          !searchValue.value ||
          item.name.toLowerCase().includes(searchValue.value.toLowerCase()),
      ) ?? [],
  );

  const formData = computed(() =>
    formListData.value.map((item) => ({ id: item.id, name: item.name })),
  );

  const onCancelListItem = (id: string) => {
    formListData.value = formListData.value.filter((item) => item.id !== id);

    const index = participantList.value.findIndex((item) => item.id === id);

    participantList.value[index].value = false;
  };

  const onSelectHost = (val: boolean, index: number) => {
    if (val) {
      formListData.value.push({
        id: participantList.value?.at(index)?.id ?? "",
        name: participantList.value?.at(index)?.name ?? "",
      });
    } else {
      formListData.value = formListData.value.filter(
        (item) => item.id !== participantList.value[index].id,
      );
    }
  };

  const handleUpdateRouteQuery = () => {
    const participants = (
      query?.participantList ? JSON.parse(query.participantList as string) : []
    ) as IMemberProps[];

    const hosts = (
      query?.hostList ? JSON.parse(query.hostList as string) : []
    ) as IMemberProps[];

    participantList.value =
      participants?.map(
        (participant) =>
          ({
            ...participant,
            value: hosts.some((item) => item.id === participant.id),
          }) as { id: string; name: string; value: boolean },
      ) ?? [];

    formListData.value = hosts;
  };

  onMounted(() => {
    handleUpdateRouteQuery();
  });

  return {
    appStore,
    searchValue,
    participantFilter,
    formListData,
    participantList,
    formData,
    onCancelListItem,
    onSelectHost,
  };
};
