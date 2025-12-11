<script setup lang="ts">
import LinkIcon from "@/icon/link/index.vue";
import { ArrowLeftBold } from "@element-plus/icons-vue";
import Logo from "@icon/logo/index.vue";
import Translate from "@icon/translate/index.vue";
import Avatar from "../../components/avatar/index.vue";
import Header from "../../components/header/index.vue";
import VideoPlayer from "../../components/video-player/index.vue";
import MenuButton from "./components/intelligent-menu-button/index.vue";
import IntelligentResult from "./components/intelligent-result/index.vue";
import IntelligentSummary from "./components/intelligent-summary/index.vue";
import VideoEditing from "./components/video-editing/index.vue";
import { useAction } from "./hooks";
import { SegmentedEnum } from "./props";

const {
  appStore,
  state,
  translateState,
  menuButtonState,
  summaryState,
  menuButtonRef,
  detailVideoRef,
  isEditVideo,
  onTranslate,
  onIntelligentList,
  onRemoveRecord,
  onExport,
  onJumpTime,
  handleUpdateVideoUrl,
  onCutVideo,
  copyRecordLink,
} = useAction();
</script>

<template>
  <Header />
  <div class="container">
    <div class="container-header">
      <el-icon size="2.24rem"><Logo /></el-icon>
      <div class="meeting-message">
        <div class="meeting-title" @click="() => onIntelligentList()">
          <el-icon><ArrowLeftBold /></el-icon>
          <span>{{ state.title }}</span>
        </div>
        <div class="meeting-time text-secondary">
          {{ state.meetingNumber }} | {{ state.startDate }}
        </div>
      </div>
      <div class="intelligent-filter">
        <el-tooltip
          class="box-item"
          effect="dark"
          content="複製鏈接"
          placement="bottom"
        >
          <el-icon size="18" @click="copyRecordLink()">
            <link-icon />
          </el-icon>
        </el-tooltip>

        <el-dropdown placement="bottom" trigger="click">
          <el-button type="primary" plain>
            <el-icon size="1rem"><Translate /></el-icon>
            翻譯
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="(item, index) in translateState.options"
                :key="index"
                @click="onTranslate(item?.value)"
              >
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <menu-button
          ref="menuButtonRef"
          trigger="click"
          :data="menuButtonState.data"
          @click="onExport"
        >
          <el-button type="primary" plain>
            <i class="iconfont icon-export" />
            導出
          </el-button>
        </menu-button>
        <el-button type="danger" plain @click="onRemoveRecord">
          <i class="iconfont icon-delete2" />
          刪除
        </el-button>
      </div>
      <Avatar :size="36" :name="appStore.userName" />
    </div>

    <div class="container-main" v-if="!isEditVideo">
      <div class="main-video">
        <video-player
          ref="detailVideoRef"
          :src="state?.videoUrl ?? ''"
          :on-error="handleUpdateVideoUrl"
          @on-cut-video-callback="onCutVideo"
        />
      </div>
      <div class="main-option">
        <el-tabs v-model="state.segmented">
          <el-tab-pane
            v-for="item in Object.values(SegmentedEnum)"
            :label="item"
            :name="item"
          />
        </el-tabs>
        <el-scrollbar
          v-loading="translateState.loading"
          height="calc(100vh - 200px)"
          style="padding: 0 1rem 0 0.25rem"
        >
          <intelligent-result
            :recordDetail="translateState.recordDetail"
            :visible="state.segmented === SegmentedEnum.Recording"
            @jump="onJumpTime"
          />
          <intelligent-summary
            :summaryData="summaryState.summaryText"
            :visible="state.segmented === SegmentedEnum.Summary"
          />
        </el-scrollbar>
      </div>
    </div>

    <video-editing v-else v-model="isEditVideo" :recordDetail="state" />
  </div>
</template>

<style scoped lang="scss">
@use "./index";
</style>
