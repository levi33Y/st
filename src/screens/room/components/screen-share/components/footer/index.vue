<template>
  <div class="screen-share-footer">
    <!--    <div class="footer-option">-->
    <!--      <el-icon class="option-refresh"><Refresh @click="onRefresh" /></el-icon>-->
    <!--      <div class="option-share">-->
    <!--        <el-checkbox v-model="isSharAudio" @change="onShareVideo" />-->
    <!--        同時共享電腦聲音-->
    <!--        <el-tooltip content="共享屏幕的同時，會議成員將聽到你電腦上的聲音">-->
    <!--          <el-icon :size="20"><warring-icon /></el-icon>-->
    <!--        </el-tooltip>-->
    <!--      </div>-->
    <!--    </div>-->

    <div class="footer-action">
      <el-button class="footer-btn" @click="onCancel">取消</el-button>
      <el-button class="footer-btn" type="primary" @click="onConfirm">
        確認共享
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { ref } from "vue";
import { useAppStore } from "../../../../../../stores/useAppStore";
import { useSettingsStore } from "../../../../../../stores/useSettingsStore";
import manageDevices from "../../../../../../utils/manage-devices";

interface Emits {
  (event: "cancel"): void;
  (event: "confirm", isShareAudio: boolean): void;
  (event: "refresh"): void;
}

const emits = defineEmits<Emits>();

const isSharAudio = ref<boolean>(false);

const appStore = useAppStore();

const settingStore = useSettingsStore();

const handleDownloadVirtual = () => {
  if (appStore.appInfo.platform === "mac") {
    window.device.onInstall().catch((e) => {
      ElMessage.error(e);
    });
  } else if (appStore.appInfo.platform === "win") {
    // window.device
    //   .onInstallByPlatform(appStore.appInfo.platform)
    //   .catch((e) => {
    //     console.log(e);
    //   });
  }
};

const handleVirtual = async () =>
  new Promise<MediaDeviceInfo>(async (resolve, reject) => {
    const virtualCable = await manageDevices.getAudioVirtualOutputDevice();

    if (!virtualCable) return reject("");

    resolve(virtualCable);
  });

const onShareVideo = async (val: boolean) => {
  handleVirtual()
    .then((virtualCable) => {
      settingStore.virtualAudioLine = virtualCable ?? undefined;
    })
    .catch(() => {
      val && handleDownloadVirtual();

      isSharAudio.value = false;
    });
};

const onCancel = () => emits("cancel");

const onConfirm = () => {
  emits("confirm", false);
};

const onRefresh = () => emits("refresh");
</script>

<style scoped lang="scss">
@use "./index";
</style>
