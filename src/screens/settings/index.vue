<template>
  <Header
    title="設置"
    borderBottom
    :hide-minimizable="true"
    :hide-maximizable="true"
    :is-destroy="true"
  />

  <div class="settings-container">
    <div class="left">
      <div
        :class="['category', carouselItemName === 'settings' && 'active']"
        @click="setActiveItem('settings')"
      >
        <i class="iconfont icon-setting" />
        <p class="label">常規設置</p>
      </div>
      <div
        :class="['category', carouselItemName === 'audio' && 'active']"
        @click="setActiveItem('audio')"
      >
        <i class="iconfont icon-audio-on" />
        <p class="label">音頻</p>
      </div>
      <div
        :class="['category', carouselItemName === 'record' && 'active']"
        @click="setActiveItem('record')"
      >
        <el-icon :size="20">
          <RecordingIcon />
        </el-icon>
        <p class="label">錄製</p>
      </div>
      <div
        :class="['category', carouselItemName === 'about-us' && 'active']"
        @click="setActiveItem('about-us')"
      >
        <img class="image" src="../../assets/images/sugarTalkLogo.png" />
        <p class="label">關於我們</p>
      </div>
    </div>
    <div class="right">
      <template v-if="carouselItemName === 'settings'">
        <Settings />
      </template>
      <template v-if="carouselItemName === 'audio'">
        <AudioManage />
      </template>
      <template v-if="carouselItemName === 'record'">
        <Record />
      </template>
      <template v-if="carouselItemName === 'about-us'">
        <AboutUs />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import RecordingIcon from "@icon/recording/index.vue";
import { ref } from "vue";
import Header from "../../components/header/index.vue";
import AboutUs from "./components/about-us/index.vue";
import AudioManage from "./components/audio-manage/index.vue";
import Record from "./components/record/index.vue";
import Settings from "./components/settings/index.vue";

const carousel = ref();

const carouselItemName = ref("settings");

const setActiveItem = (name: string) => {
  carousel.value?.setActiveItem(name);
  carouselItemName.value = name;
};
</script>

<style scoped lang="scss">
@use "./index";
</style>
