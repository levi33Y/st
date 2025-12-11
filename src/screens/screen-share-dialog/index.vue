<script setup lang="ts">
import Header from "@components/header/index.vue";
import { Refresh } from "@element-plus/icons-vue";
import AppScreen from "./components/app-screen/index.vue";
import { useAction } from "./trtc";

const {
  appSources,
  screenSources,
  currentSource,
  currentAppIcon,
  shareAudio,
  appIcons,
  onGetSources,
  onChoiceSources,
  onChoiceApp,
  onSwitchAudio,
  onCancel,
  onConfirm,
} = useAction();
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
        <div v-for="source in screenSources" :key="source.id">
          <app-screen
            :source="source"
            :active="currentSource?.id === source.id"
            @click="onChoiceSources"
          />
        </div>
        <!--        <app-screen
          :source="{
            appIcon: '',
            display_id: 'whiteboard',
            id: 'whiteboard',
            name: '白板',
            thumbnail: '',
          }"
          :active="currentSource?.id === 'whiteboard'"
          @click="onChoiceSources"
        >
          <div class="app-screen-img">
            <el-icon></el-icon>
          </div>
        </app-screen>
        <app-screen
          :source="{
            appIcon: '',
            display_id: 'audio',
            id: 'audio',
            name: '僅電腦聲音',
            thumbnail: '',
          }"
          :active="currentSource?.id === 'audio'"
          @click="onChoiceSources"
        >
          <div class="app-screen-img">
            <el-icon></el-icon>
          </div>
        </app-screen>-->
      </div>

      <!--      <screen-tabs
        :appIcons="appIcons"
        :current-app-icon="currentAppIcon"
        @click="onChoiceApp"
      />

      <el-scrollbar height="250">
        <div class="screen-list">
          <div v-for="source in appSources" :key="source.id">
            <app-screen
              :source="source"
              :active="currentSource?.id === source.id"
              @click="onChoiceSources"
            />
          </div>
        </div>
      </el-scrollbar>-->
    </div>

    <div class="screen-share-footer">
      <div class="footer-option">
        <el-icon size="20" style="cursor: pointer">
          <Refresh @click="onGetSources" />
        </el-icon>
        <!--        <div class="share-audio">
          <el-checkbox v-model="shareAudio" @change="onSwitchAudio" />
          同時共享電腦聲音
          <el-tooltip content="共享屏幕的同時，會議成員將聽到你電腦上的聲音">
            <el-icon :size="20"><warring-icon /></el-icon>
          </el-tooltip>
        </div>-->
      </div>
      <div class="footer-action">
        <el-button size="large" @click="onCancel">取消</el-button>
        <el-button size="large" type="primary" @click="onConfirm">
          確認共享
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
