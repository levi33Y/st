<template>
  <div
    :class="[
      'header',
      borderBottom && 'border-bottom',
      props?.isInner && 'inner',
    ]"
  >
    <div class="left">
      <template v-if="isMac">
        <slot name="traffic-light">
          <template v-if="props?.isInner">
            <div class="close-btn-container">
              <div class="close-btn" @click="props?.close">
                <i class="iconfont icon-close" />
              </div>
            </div>
          </template>
        </slot>
      </template>
      <slot name="left"></slot>
    </div>
    <slot>
      <span class="title">{{ title }}</span>
    </slot>
    <div class="right">
      <slot name="right"></slot>
      <div v-if="isDetail">
        <el-popover
          placement="top"
          trigger="click"
          :show-arrow="false"
          width="80px"
        >
          <div style="text-align: left; margin: 0">
            <el-button size="small" text @click="openRule"
              >重新入會規則</el-button
            >
            <el-button
              size="small"
              style="margin-left: 0"
              type="danger"
              text
              @click="openDel"
              >刪除</el-button
            >
          </div>
          <template #reference>
            <div class="btn-detail">
              <el-icon><MoreFilled /></el-icon>
            </div>
          </template>
        </el-popover>
      </div>

      <template v-if="isWin">
        <slot name="traffic-light">
          <template v-if="props?.isInner">
            <div class="btn-close" @click="props?.close">
              <i class="iconfont icon-close" />
            </div>
          </template>

          <template v-else>
            <TrafficLight
              :hide-minimizable="props.hideMinimizable"
              :hide-maximizable="props.hideMaximizable"
              :is-destroy="props.isDestroy"
              :close="props.close"
            />
          </template>
        </slot>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRefs, ref } from "vue";
import TrafficLight from "../traffic-light/index.vue";
import { useAppStore } from "../../stores/useAppStore";
import { computed } from "vue";
import { MoreFilled } from "@element-plus/icons-vue";

interface Props {
  isInner?: boolean;
  title?: string;
  borderBottom?: boolean;
  hideMinimizable?: boolean;
  hideMaximizable?: boolean;
  isDestroy?: boolean;
  isDetail?: boolean;
  close?: () => void;
}
interface Emits {
  (event: "openRule"): void;
  (event: "openDel"): void;
}
const emits = defineEmits<Emits>();

const props = defineProps<Props>();

const appStore = useAppStore();

const isWin = computed(() => appStore.appInfo.platform === "win");

const isMac = computed(() => appStore.appInfo.platform === "mac");
const { title, borderBottom } = toRefs(props);
const openRule = () => emits("openRule");
const openDel = () => emits("openDel");
</script>

<style scoped lang="scss">
@use "./index";
</style>
