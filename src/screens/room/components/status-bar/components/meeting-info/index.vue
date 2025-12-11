<template>
  <el-popover
    placement="bottom"
    :width="200"
    trigger="hover"
    :show-arrow="true"
  >
    <template #reference>
      <div class="meeting-info">
        <i class="iconfont icon-info" />
      </div>
    </template>
    <div class="meeting-info-container">
      <p class="title">會議主題：{{ title }}</p>
      <div class="info-item">
        <p class="info-label">會議號：</p>
        <p>{{ meetingNumber }}</p>
        <i class="iconfont icon-copy" @click="onCopy" />
      </div>
      <div class="info-item">
        <p class="info-label">創建人：</p>
        <p>{{ moderatorName }}</p>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { useAppStore } from "../../../../../../stores/useAppStore";

interface Props {
  meetingNumber: string;
  moderatorName: string;
  title: string;
}

const { meetingNumber, moderatorName, title } = defineProps<Props>();

const appStore = useAppStore();

const onCopy = () => {
  window.clipboard.writeText(`#${appStore.appInfo.name}: ${meetingNumber}`);
  ElMessage({
    offset: 28,
    message: "會議號已複製到粘貼板",
    type: "success",
  });
};
</script>

<style scoped lang="scss">
@use "./index";
</style>
