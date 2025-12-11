<template>
  <Scroll>
    <div class="audio-manage-container">
      <div class="audio-manage-item">
        <p class="title">揚聲器</p>
        <div class="device-item">
          <el-select
            v-model="state.audioOutputDeviceId"
            placeholder=" "
            @change="onOutputChange"
          >
            <el-option
              v-for="item in audioOutputDevices"
              :key="item.deviceId"
              :label="item.deviceName"
              :value="item.deviceId"
            />
          </el-select>
          <el-button @click="onPlay">
            {{ state.isPlay ? "停止檢測" : "檢查揚聲器" }}
          </el-button>
        </div>

        <!-- <div>
          <p>输出等级</p>
        </div> -->
        <div class="volume-manage">
          <p>輸出音量</p>
          <div class="volume-muted" @click="setMuted">
            <i
              :class="[
                'iconfont',
                settingsStore.muted ? 'icon-audio-off' : 'icon-audio-on',
              ]"
            />
          </div>
          <div class="volume-manage-content">
            <el-slider
              v-model="state.volume"
              style="
                --el-slider-button-size: 12px;
                --el-slider-button-wrapper-size: 24px;
                --el-slider-button-wrapper-offset: -9px;
              "
              @input="setVolume"
              @mousedown="onDeviceMouseDown"
              @mouseenter="onDeviceMouseDown"
              @mouseleave="onDeviceMouseUp"
            />
          </div>
        </div>
      </div>

      <div class="audio-manage-item">
        <p class="title">麥克風</p>
        <div class="device-item">
          <el-select
            v-model="state.audioInputDeviceId"
            placeholder=" "
            @change="onInputChange"
          >
            <el-option
              v-for="item in audioInputDevices"
              :key="item.deviceId"
              :label="item.deviceName"
              :value="item.deviceId"
            />
          </el-select>
        </div>
      </div>
    </div>
  </Scroll>
</template>

<script setup lang="ts">
import Scroll from "../scroll/index.vue";
import { useAction } from "./hooks";

const {
  state,
  settingsStore,
  audioOutputDevices,
  audioInputDevices,
  setVolume,
  setMuted,
  onPlay,
  onOutputChange,
  onInputChange,
  onDeviceMouseDown,
  onDeviceMouseUp,
} = useAction();
</script>

<style scoped lang="scss">
@use "./index";
</style>
