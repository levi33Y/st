<template>
  <ActionBtn
    v-if="isShareScreen"
    title="結束共享"
    icon="icon-screen-end"
    @click="
      () => {
        emits('stopShare');
      }
    "
  >
    <el-icon size="32" color="#36cf70"><share-screen-icon /></el-icon>
  </ActionBtn>
  <ActionBtn v-else title="共享屏幕" icon="icon-share-screen" @click="onStart">
    <el-icon size="32" color="#5A5B6D"><share-screen-icon /></el-icon>
  </ActionBtn>

  <el-dialog
    class="custom-dialog"
    v-model="visible"
    :width="718"
    :append-to-body="true"
    :center="true"
    :show-close="false"
    :align-center="true"
    @close="() => beforeOpen?.(false)"
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
import ShareScreenIcon from "@icon/share-screen/index.vue";
import { toRefs } from "vue";
import Header from "../../../../components/header/index.vue";
import { ScreenSource } from "../../../../entity/types";
import ActionBtn from "../action-btn/index.vue";
import Footer from "./components/footer/index.vue";
import Screen from "./components/screen/index.vue";
import Tabs from "./components/tabs/index.vue";
import { useAction } from "./hooks";

interface Props {
  isShareScreen: boolean;
  beforeOpen?: (isUsing?: boolean) => Promise<boolean> | boolean;
}

interface Emits {
  (event: "startShare", source: ScreenSource, isShareAudio: boolean): void;
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
  onOpen,
  onClose,
  onSelect,
  onChangeAppIcon,
} = useAction();

const onStart = async () => {
  const isReject = await beforeOpen?.value?.(true);
  if (isReject) return;
  onOpen();
};

const onConfirm = (isShareAudio: boolean) => {
  onClose();

  currentSource.value && emits("startShare", currentSource.value, isShareAudio);
};
</script>

<style scoped lang="scss">
@use "./index";
</style>
