<template>
  <div :class="['translate-chat', isSelf && 'self']">
    <div class="container">
      <div class="chat-time">{{ createDate }}</div>
      <template v-if="!revocation">
        <div class="user-info">
          <p class="user-name">{{ meetingSpeech.userName }}</p>
          <p class="translate-status">{{ isPlaying ? "播放中" : "已轉譯" }}</p>
          <div class="spacer" />
          <p :class="['chat-unread', viewed && 'read']">
            {{ viewed ? "已讀" : "未讀" }}
          </p>
        </div>
        <div
          class="audio-frequency"
          :style="!isComputed ? 'justify-content: center' : ''"
          @click="onPlay"
          @contextmenu.prevent="showContextMenu"
        >
          <div
            v-show="isPlaying"
            class="progress-box"
            :style="`width: ${(currentTime / duration) * 100}%`"
          >
            <div class="progress" />
          </div>
          <template v-if="isComputed">
            <i :class="['iconfont', isPlaying ? 'icon-play' : 'icon-volume']" />
            <p class="duration">{{ Math.ceil(duration) }}“</p>
          </template>
          <p class="video-speaking" v-else>轉譯中...</p>
          <audio ref="audioRef" :src="meetingSpeech?.voiceRecord?.voiceUrl" />
        </div>
        <div class="translate-content" v-loading="!isComputed">
          <div v-show="isComputed">
            <p class="translate-text">原文：{{ meetingSpeech.originalText }}</p>
            <p class="translate-text">
              譯文：{{ meetingSpeech?.voiceRecord?.translatedText }}
            </p>
          </div>
        </div>
      </template>
      <div v-else>
        <p class="chat-time">{{ meetingSpeech.userName }}撤回了一條消息</p>
      </div>
    </div>
    <!-- 右键菜单 -->
    <div
      v-show="contextMenuVisible && isSelf"
      ref="contextMenuRef"
      class="context-menu"
      :style="{
        top: contextMenuTop + 'px',
        left: contextMenuLeft + 'px',
      }"
    >
      <el-button :icon="RefreshRight" @click="handleButtonClick">
        撤回
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshRight } from "@element-plus/icons-vue";
import { useEventListener } from "@vueuse/core";
import moment from "moment";
import { computed, nextTick, onMounted, onUnmounted, ref, toRefs } from "vue";
import { GenerationStatus, SpeechStatus } from "../../../../../../entity/enum";
import { MeetingSpeech } from "../../../../../../entity/types";

interface Props {
  isSelf: boolean;
  meetingSpeech: MeetingSpeech;
}

interface Emits {
  (event: "updateStatus", meetingSpeech: MeetingSpeech): void;
  (event: "cancelStatus", meetingSpeech: MeetingSpeech): void;
}

const props = defineProps<Props>();

const { isSelf, meetingSpeech } = toRefs(props);

const emits = defineEmits<Emits>();

const audioRef = ref<HTMLAudioElement>();

const duration = ref(0);

const currentTime = ref(0);

const isPlaying = ref(false);

const contextMenuVisible = ref(false);

const contextMenuLeft = ref(0);

const contextMenuTop = ref(0);

const contextMenuRef = ref<HTMLElement | null>(null);

const showContextMenu = (event: MouseEvent) => {
  contextMenuVisible.value = !contextMenuVisible.value;
  contextMenuLeft.value = event.clientX;
  contextMenuTop.value = event.clientY;
};

const handleButtonClick = () => {
  emits("cancelStatus", meetingSpeech.value);
  contextMenuVisible.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (
    contextMenuRef.value &&
    !contextMenuRef.value.contains(target) &&
    contextMenuVisible.value
  ) {
    contextMenuVisible.value = false;
  }
};

const viewed = computed(
  () => meetingSpeech.value.status === SpeechStatus.Viewed,
);
const revocation = computed(
  () => meetingSpeech.value.status === SpeechStatus.Cancelled,
);

const onPlay = () => {
  if (duration.value !== 0) {
    if (!isPlaying.value) {
      isPlaying.value = true;
      audioRef.value!.currentTime = 0;
      audioRef.value?.play?.();
      emits("updateStatus", meetingSpeech.value);
    } else {
      isPlaying.value = false;
      audioRef.value?.pause?.();
    }
  }
};

useEventListener(audioRef, "timeupdate", (ev) => {
  duration.value = audioRef.value!.duration;
  currentTime.value = audioRef.value!.currentTime;
});

useEventListener(audioRef, "ended", (ev) => {
  currentTime.value = duration.value;
  requestAnimationFrame(() => (isPlaying.value = false));
});
const createDate = computed(() => {
  return moment(props.meetingSpeech.createdDate).format("HH:mm");
});
const isComputed = computed(() => {
  return (
    meetingSpeech.value?.voiceRecord?.generationStatus ===
    GenerationStatus.Completed
  );
});
onMounted(() => {
  nextTick(() => {
    audioRef.value?.addEventListener("loadedmetadata", () => {
      duration.value = audioRef.value!.duration;
    });
    document.addEventListener("mousedown", handleClickOutside);
  });
});
onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});
</script>

<style scoped lang="scss">
@use "./index";
</style>
