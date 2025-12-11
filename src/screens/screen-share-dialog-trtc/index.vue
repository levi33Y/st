<script setup lang="ts">
import Header from "@components/header/index.vue";
import { Refresh } from "@element-plus/icons-vue";
import AppScreen from "./components/app-screen/index.vue";
import { useAction } from "./hook";

const { screenSources, currentSource, onGetSources, onCancel, onConfirm } =
  useAction();
</script>

<template>
  <Header
    title="選擇共享內容"
    borderBottom
    :hideMinimizable="true"
    :hide-maximizable="true"
  />

  <div class="screen-share-container">
    <div class="screen-share-body">
      <div class="screen-list screen-list-scrollbar-x">
        <app-screen :screenSources="screenSources" v-model="currentSource" />
      </div>
    </div>

    <div class="screen-share-footer">
      <div class="footer-option">
        <el-icon size="20" style="cursor: pointer">
          <Refresh @click="onGetSources" />
        </el-icon>
      </div>
      <div class="footer-action">
        <el-button size="large" @click="onCancel">取消</el-button>
        <el-button
          size="large"
          :type="currentSource?.sourceId ? 'primary' : 'info'"
          @click="onConfirm"
          :disabled="!currentSource?.sourceId"
        >
          確認共享
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
