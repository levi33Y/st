<script setup lang="ts">
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import "./index.scss";

const props = defineProps<{
  src: string;
  onError?: () => void;
}>();

const emits = defineEmits<{
  (event: "onCutVideoCallback"): void;
}>();

const videoRef = ref<HTMLVideoElement>();

const playerRef = ref<Player>();

const CustomButton = videojs.getComponent("Button");

class CustomActionButton extends CustomButton {
  constructor(player: Player, options: any) {
    super(player, options);
    (this as any).controlText("自定義按鈕");
  }

  buildCSSClass() {
    return `vjs-custom-button ${super.buildCSSClass()}`;
  }

  handleClick() {
    emits("onCutVideoCallback");
  }
}

videojs.registerComponent("CustomActionButton", CustomActionButton as any);

const initPlayer = () => {
  if (!videoRef.value) return;

  const player = videojs(videoRef.value, {
    controls: true,
    fluid: false,
    inactivityTimeout: 2000,
    controlBar: {
      children: [
        "playToggle", // 播放/暂停按钮
        "currentTimeDisplay", // 当前播放时间,css设置时间分隔符 "/"
        "durationDisplay", // 总时长
        "progressControl", // 进度条（会显示在顶部）
        "customActionButton", // 自定义按钮
        "volumePanel", // 音量控制
        "playbackRateMenuButton", // 播放速率
        "fullscreenToggle", // 全屏按钮
      ],
      progressControl: {
        seekBar: true,
      },
      playbackRateMenuButton: {
        playbackRates: [0.5, 1, 1.5, 2],
      },
    },
    playbackRates: [0.5, 1, 1.5, 2],
  });

  playerRef.value = player;

  player.on("error", () => {
    props.onError?.();
  });

  player.on("useractive", () => {
    player.removeClass("vjs-user-inactive-custom");
    player.addClass("vjs-user-active-custom");
  });

  player.on("userinactive", () => {
    player.removeClass("vjs-user-active-custom");
    player.addClass("vjs-user-inactive-custom");
  });
};

const destroyPlayer = () => {
  if (playerRef.value) {
    playerRef.value.dispose();
    playerRef.value = undefined;
  }
};

defineExpose({
  player: playerRef,
  getVideoElement: () => videoRef.value,
  getCurrentTime: () => playerRef.value?.currentTime(),
  setCurrentTime: (time: number) => {
    if (playerRef.value) {
      playerRef.value.currentTime(time);
    }
  },
});

watch(
  () => props.src,
  (newSrc) => {
    if (playerRef.value && newSrc) {
      playerRef.value.src({ src: newSrc, type: "video/mp4" });
    }
  },
);

onMounted(() => {
  initPlayer();

  if (props.src && playerRef.value) {
    playerRef.value.src({ src: props.src, type: "video/mp4" });
  }
});

onBeforeUnmount(() => {
  destroyPlayer();
});
</script>

<template>
  <div id="video-player-wrapper">
    <video
      ref="videoRef"
      class="video-js vjs-big-play-centered"
      playsinline
    ></video>
  </div>
</template>

<style scoped lang="scss"></style>
