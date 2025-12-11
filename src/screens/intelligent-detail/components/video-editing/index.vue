<script setup lang="ts">
import Delete from "@icon/delete/index.vue";
import Divider from "@icon/divider/index.vue";
import Rollback from "@icon/rollback/index.vue";
import Rollfront from "@icon/rollfront/index.vue";
import Rotate from "@icon/rotate/index.vue";
import { IIntelligentDetailStateProps } from "../../props";
import { useAction } from "./hook";

const model = defineModel<boolean>();

const props = defineProps<{ recordDetail: IIntelligentDetailStateProps }>();

const {
  // ref变量
  inputUrl,
  timelineRef,
  isDraggingCutter,
  videoFrames,
  isLoadingFrames,
  currentPlayingSegmentIndex,
  isJumping,
  videoUrl,
  videoDuration,
  currentTime,
  videoRef,
  isPlaying,
  editMode,
  segments,
  selectedSegmentId,
  cutPosition,
  history,
  historyIndex,
  // 计算属性
  canUndo,
  canRedo,
  cutterPosition,
  timelineBackgroundImage,
  isGeneratingBackground,
  rulerMarks,
  // 函数
  addToHistory,
  cutVideo,
  deleteSegment,
  undo,
  redo,
  restore,
  selectSegment,
  setCutPosition,
  initVideoWithFrames,
  selectFirstSegment,
  generateVideoFrames,
  formatTime,
  startDragCutter,
  onDragCutter,
  stopDragCutter,
  handleSegmentClick,
  handleCut,
  handleDelete,
  updateCutterPosition,
  getValidSegments,
  handleVideoTimeUpdate,
  handleVideoClick,
  handleExport,
  getSegmentStyle,
  getSegmentBackgroundStyle,
  generateId,
  initVideo,
  isTimeInDeletedSegment,
} = useAction(props.recordDetail, model);
</script>

<template>
  <div class="video-editor">
    <div class="video-section">
      <div class="video-container">
        <div
          v-show="isTimeInDeletedSegment(cutPosition)"
          class="video-blackout"
        ></div>

        <div
          v-show="!isTimeInDeletedSegment(cutPosition)"
          class="video-wrapper"
          @click="handleVideoClick"
        >
          <video
            ref="videoRef"
            class="video-player"
            @timeupdate="
              () => {
                currentTime = videoRef?.currentTime || 0;
                handleVideoTimeUpdate();
              }
            "
            @play="isPlaying = true"
            @pause="isPlaying = false"
          ></video>

          <div class="video-overlay" v-if="videoDuration > 0">
            <div class="play-pause-icon">
              <svg
                v-if="!isPlaying"
                class="icon-play"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <svg
                v-else
                class="icon-pause"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="videoDuration > 0" class="editor-section">
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <el-button :disabled="isLoadingFrames" @click="handleCut">
            <template #icon>
              <el-icon :size="18">
                <divider />
              </el-icon>
            </template>
          </el-button>
          <el-button
            :disabled="
              !selectedSegmentId ||
              isLoadingFrames ||
              segments.filter((s) => !s.deleted).length <= 1
            "
            @click="handleDelete"
          >
            <el-icon :size="18">
              <delete />
            </el-icon>
          </el-button>
          <el-button :disabled="!canUndo || isLoadingFrames" @click="undo">
            <el-icon :size="18">
              <rollback />
            </el-icon>
          </el-button>
          <el-button :disabled="!canRedo || isLoadingFrames" @click="redo">
            <el-icon :size="18">
              <rollfront />
            </el-icon>
          </el-button>
        </div>

        <div class="toolbar-right">
          <el-button :disabled="isLoadingFrames" @click="restore">
            <el-icon :size="18">
              <rotate />
            </el-icon>
            <span style="padding-left: 3px">復原</span>
          </el-button>
        </div>
      </div>

      <div class="timeline-container">
        <!--        <div class="timeline-ruler">-->
        <!--          <div-->
        <!--              v-for="mark in rulerMarks"-->
        <!--              :key="mark.time"-->
        <!--              class="ruler-mark"-->
        <!--              :style="{ left: `${mark.position}%` }"-->
        <!--          >-->
        <!--            <div class="ruler-tick"></div>-->
        <!--            <div class="ruler-label">{{ mark.label }}</div>-->
        <!--          </div>-->
        <!--        </div>-->

        <div class="timeline-main">
          <div ref="timelineRef" class="timeline">
            <div
              v-for="segment in segments"
              :key="segment.id"
              class="timeline-segment"
              :class="{
                'segment-deleted': segment.deleted,
                'segment-selected':
                  segment.id === selectedSegmentId && !segment.deleted,
                'segment-selectable': !segment.deleted,
              }"
              :style="{
                ...getSegmentStyle(segment),
                ...getSegmentBackgroundStyle(segment),
              }"
              @click="handleSegmentClick(segment.id, $event)"
            >
              <div
                v-if="segment.id === selectedSegmentId && !segment.deleted"
                class="segment-border"
              />

              <div v-if="segment.deleted" class="segment-delete-mask" />
            </div>
          </div>

          <div
            class="cutter"
            :style="{ left: `${cutterPosition}%` }"
            @mousedown="startDragCutter"
          >
            <div class="cutter-line"></div>
            <div class="cutter-handle"></div>
            <div class="cutter-time" v-if="isDraggingCutter">
              {{ formatTime(cutPosition) }}
            </div>
          </div>
        </div>
      </div>

      <div class="editor-footer">
        <el-button @click="model = false">退出</el-button>
        <el-button
          type="primary"
          :disabled="isLoadingFrames"
          @click="handleExport"
        >
          另存為新文件
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./index";
</style>
