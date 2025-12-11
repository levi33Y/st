<template>
  <Scroll>
    <el-form label-position="top">
      <Checkbox
        :checked="settingsStore.enableCamera"
        @change="(checked) => (settingsStore.enableCamera = checked)"
      >
        入會開啟攝像頭
      </Checkbox>
      <Checkbox
        :checked="settingsStore.enableMicrophone"
        @change="(checked) => (settingsStore.enableMicrophone = checked)"
      >
        入會開啟麥克風
      </Checkbox>
      <Checkbox
        :checked="settingsStore.showMeetingDuration"
        @change="(checked) => (settingsStore.showMeetingDuration = checked)"
      >
        顯示參會時長
      </Checkbox>

      <Checkbox
        :checked="settingsStore.openDevTools"
        @change="(checked) => (settingsStore.openDevTools = checked)"
      >
        開啟 DevTools
      </Checkbox>

      <Checkbox
        :disabled="true"
        :checked="settingsStore.enableWatermark"
        @change="(checked) => (settingsStore.enableWatermark = checked)"
      >
        開啟水印
      </Checkbox>

      <Checkbox
        :disabled="true"
        :checked="settingsStore.enableMCU"
        @change="(checked) => (settingsStore.enableMCU = checked)"
      >
        開啟MCU
      </Checkbox>
      <!--      <Checkbox
        :checked="settingsStore.enableFilter"
        @change="(checked) => (settingsStore.enableFilter = checked)"
      >
        <div
          style="
            display: flex;
            column-gap: var(&#45;&#45;spacing-tiny);
            align-items: center;
          "
        >
          開啟SugarTalk窗口過濾
          <el-tooltip placement="top-start">
            <template #content>
              <p>關閉窗口過濾後，會中成員將在共享畫面</p>
              <p>中看到你的SugarTalk窗口</p>
            </template>
            <el-icon color="var(&#45;&#45;color-black)" :size="16">
              <warring-icon />
            </el-icon>
          </el-tooltip>
        </div>
      </Checkbox>-->
    </el-form>
  </Scroll>
</template>

<script setup lang="ts">
import WarringIcon from "@icon/warring/index.vue";
import { useSettingsStore } from "../../../../stores/useSettingsStore";
import Checkbox from "../check-box/index.vue";
import Scroll from "../scroll/index.vue";

const settingsStore = useSettingsStore();
</script>

<style scoped lang="scss">
@use "./index";
</style>
