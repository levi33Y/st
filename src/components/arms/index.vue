<script setup lang="ts">
import { RoutePath } from "@/entity/types";
import { useAppStore } from "@/stores/useAppStore";
import { useMeetingStore } from "@/stores/useMeetingStore";
import { armsService, IArmsSDKConfigProps } from "@components/arms/ArmsService";
import { onMounted } from "vue";

const appStore = useAppStore();

const hashQuery: string[] =
  window.location.hash.split("#")?.at(1)?.split("&") ?? [];

const initArms = async (page?: RoutePath | "/") => {
  let config = {} as IArmsSDKConfigProps;

  const meetingPage: RoutePath[] = ["/trtc-room"];

  try {
    const { version } = await window.electronAPI.appInfo();

    config.release = version;

    if (page === "/") {
      config.page = "/login";
    } else if (page) {
      config.page = page;

      if (meetingPage.includes(page)) {
        const meetingNumber =
          hashQuery
            .find((item) => item.startsWith("meetingNumber"))
            ?.split("=")
            ?.at(1) ?? "";

        config.c1 = meetingNumber;
      }

      if (appStore?.userInfo?.id) {
        config.uid = appStore.userInfo.id + "";
      }

      if (appStore?.userInfo?.userName) {
        config.setUsername = function () {
          return appStore.userInfo.userName;
        };
      }
    }
  } finally {
    armsService.bindInstance(config);
  }
};

onMounted(async () => {
  const page = hashQuery?.at(0)?.split("?")?.at(0);

  await initArms(page as RoutePath);
});
</script>

<template>
  <slot />
</template>

<style scoped lang="scss"></style>
