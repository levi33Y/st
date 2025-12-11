<template>
  <ActionBtn
    v-if="isShareScreen"
    title="結束共享"
    icon="icon-screen-end"
    @click="onStopShare"
  />
  <ActionBtn v-else title="共享屏幕" icon="icon-screen" @click="onStart" />

  <el-dialog
    class="custom-dialog"
    v-model="visible"
    :width="718"
    :append-to-body="true"
    :center="true"
    :show-close="false"
    :align-center="true"
  >
    <Header
      title="選擇共享內容"
      :is-inner="true"
      borderBottom
      :close="onClose"
    />
    <div class="screen-share-body">
      <div class="screen-list">
        <div
          class="screen-item"
          v-for="source in screenSources"
          :key="source.id"
        >
          <Screen
            :source="source"
            :active="currentSource?.id === source.id"
            @click="onSelect"
          />
        </div>
      </div>
      <Tabs
        :appIcons="appIcons"
        :currentAppIcon="currentAppIcon"
        @click="onChangeAppIcon"
      />
      <el-scrollbar>
        <div class="screen-list screen-list-scrollbar">
          <div
            class="screen-item"
            v-for="source in appSources"
            :key="source.id"
          >
            <Screen
              :source="source"
              :active="currentSource?.id === source.id"
              @click="onSelect"
            />
          </div>
        </div>
      </el-scrollbar>
    </div>
    <Footer @cancel="onClose" @confirm="onConfirm" @refresh="onOpen" />
  </el-dialog>
</template>

<script setup lang="ts">
import ActionBtn from "../action-btn/index.vue";
import Header from "../../../../components/header/index.vue";
import Screen from "./components/screen/index.vue";
import Tabs from "./components/tabs/index.vue";
import Footer from "./components/footer/index.vue";
import { useAction } from "./hooks";
import { ScreenSource } from "../../../../entity/types";
import { toRefs } from "vue";

interface Props {
  isShareScreen: boolean;
  beforeOpen?: () => boolean;
}

interface Emits {
  (event: "startShare", source: ScreenSource): void;
  (event: "stopShare"): void;
}

const props = defineProps<Props>();

const emits = defineEmits<Emits>();

const { isShareScreen, beforeOpen } = toRefs(props);

const {
  visible,
  currentSource,
  screenSources,
  appSources,
  appIcons,
  currentAppIcon,
  navigation,
  onOpen,
  onClose,
  onSelect,
  onChangeAppIcon,
} = useAction();

const onStart = () => {
  const isReject = beforeOpen?.value?.();
  if (isReject) return;
  onOpen();
};

const onConfirm = async () => {
  onClose();
  if (currentSource.value) {
    emits("startShare", currentSource.value);

    const allDisplays = await window.electronAPI.allDisplays();

    const currentDisplay = allDisplays.find(
      (display) => display.id === Number(currentSource?.value?.display_id),
    );

    if (currentDisplay) {
      navigation.navigate("/screen-border", currentDisplay);
    }
  }

  //共享屏幕时显示屏幕名字相关代码
  // const allDisplays = await window.electronAPI.allDisplays()

  // if (allDisplays.length > 1) {
  //   allDisplays.forEach((display) =>
  //     navigation.destroy(`/screen-name/${display.id}`)
  //   )
  // }
};

const onStopShare = () => {
  emits("stopShare");

  navigation.destroy("/screen-border");
};
</script>

<style scoped lang="scss">
@use "./index";
</style>
