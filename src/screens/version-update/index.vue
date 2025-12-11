<script setup lang="ts">
import { ElProgress } from "element-plus";
import Header from "../../components/header/index.vue";
import { useAction } from "./hook";

const {
  appStore,
  releaseInfo,
  updateState,
  IDownloadingEnum,
  onDownloadUpdate,
  onQuitAndInstall,
} = useAction();
</script>

<template>
  <Header
    title="版本更新"
    borderBottom
    :hide-maximizable="true"
    :is-destroy="true"
  />

  <div class="container">
    <div class="container-header">
      <img
        class="app-logo"
        src="../../assets/images/sugarTalkLogo.png"
        style="height: 3.62rem"
      />

      <div class="header-info">
        <div class="update-header">
          <div class="sugartalk">SUGARTALK</div>
          <div class="version">V {{ releaseInfo.newVersion }}</div>
        </div>
        <div class="update-content">
          <div>為了確保應用的正常運行，我們已發佈了新版本。</div>
          <div>請注意，你必須更新到最新版本才能繼續使用應用程序。</div>
        </div>
      </div>
    </div>

    <div class="container-content" v-html="releaseInfo.releaseNotes"></div>
  </div>

  <div class="border-bottom" />
  <div class="container-bottom">
    <el-button
      v-if="updateState.downloading === IDownloadingEnum.Pending"
      type="primary"
      class="update-btn"
      @click="() => onDownloadUpdate()"
    >
      立即更新
    </el-button>
    <el-progress
      v-else-if="updateState.downloading === IDownloadingEnum.Processing"
      :percentage="updateState.processRate"
      :stroke-width="10"
      striped
    />
    <el-button
      v-else-if="updateState.downloading === IDownloadingEnum.Success"
      type="primary"
      class="update-btn"
      @click="() => onQuitAndInstall()"
    >
      退出並重新啟動
    </el-button>
  </div>
</template>

<style scoped lang="scss">
@use "./index";
</style>
