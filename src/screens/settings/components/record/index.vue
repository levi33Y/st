<template>
  <scroll>
    <div class="record-container">
      <p class="title">導出文件保存至</p>
      <div class="path-section">
        <div class="path-display">
          <el-input
            v-model="settingsStore.recordSavePath"
            placeholder="請選擇錄製文件保存路徑"
            readonly
            class="path-input"
          >
            <template #prefix>
              <el-icon :size="16">
                <FolderOpenIcon />
              </el-icon>
            </template>
          </el-input>
        </div>
        <div class="button-group">
          <el-button type="primary" @click="handleChangePath">更改</el-button>
          <el-button @click="handleOpenPath">打開</el-button>
        </div>
      </div>
    </div>
  </scroll>
</template>

<script setup lang="ts">
import FolderOpenIcon from "@icon/folder-open-filed/index.vue";
import { ElMessage } from "element-plus";
import { useSettingsStore } from "../../../../stores/useSettingsStore";
import Scroll from "../scroll/index.vue";

const settingsStore = useSettingsStore();

const handleChangePath = async () => {
  try {
    const selectedPath = await window.fileSystem.selectDirectory();
    if (selectedPath) {
      await settingsStore.setRecordSavePath(selectedPath);
      ElMessage.success("錄製路徑已更新");
    }
  } catch (error) {
    console.error("選擇路徑失敗:", error);
    ElMessage.error("選擇路徑失敗，請重試");
  }
};

const handleOpenPath = async () => {
  if (!settingsStore.recordSavePath) {
    ElMessage.warning("請先設置錄製路徑");
    return;
  }

  try {
    const result = await window.fileSystem.openDirectory(
      settingsStore.recordSavePath,
    );
    if (!result.success) {
      ElMessage.error(result.error || "打開文件夾失敗");
    }
  } catch (error) {
    console.error("打開文件夾失敗:", error);
    ElMessage.error("打開文件夾失敗，請檢查路徑是否存在");
  }
};
</script>

<style scoped lang="scss">
@use "./index";
</style>
