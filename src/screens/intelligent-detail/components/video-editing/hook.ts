import { VideoFrame } from "@/renderer";
import {
  EditMode,
  EditOperation,
  VideoSegment,
} from "@/screens/intelligent-detail/components/video-editing/props";
import { recordCut } from "@/services/index.js";
import { useDebounceFn, useTimeoutPoll } from "@vueuse/core";
import { ElLoading, ElMessage } from "element-plus";
import { computed, onMounted, Ref, ref } from "vue";
import { IIntelligentDetailStateProps } from "../../props.js";
import { formatTime, generateId } from "./utils.js";

export const useAction = (
  props: IIntelligentDetailStateProps,
  model: Ref<boolean | undefined>,
) => {
  const TIME_TOLERANCE = 0.1;

  const inputUrl = ref("");
  const timelineRef = ref<HTMLDivElement | null>(null);
  const isDraggingCutter = ref(false);
  const videoFrames = ref<VideoFrame[]>([]);
  const isLoadingFrames = ref(false);
  const currentPlayingSegmentIndex = ref<number>(0); // 当前播放的片段索引
  const isJumping = ref(false); // 是否正在跳转，防止重复触发
  // 视频相关状态
  const videoUrl = ref<string>("");
  const videoDuration = ref<number>(0);
  const currentTime = ref<number>(0);
  const videoRef = ref<HTMLVideoElement | null>(null);
  const isPlaying = ref<boolean>(false);
  // 编辑相关状态
  const editMode = ref<EditMode>(EditMode.INITIAL);
  const segments = ref<VideoSegment[]>([]);
  const selectedSegmentId = ref<string | null>(null);
  const cutPosition = ref<number>(0); // 剪刀位置（秒）
  // 历史记录
  const history = ref<EditOperation[]>([]);
  const historyIndex = ref<number>(-1);
  // 完整时间轴背景图
  const timelineBackgroundImage = ref<string>("");
  const isGeneratingBackground = ref(false);
  // 计算属性
  const canUndo = computed(() => historyIndex.value > -1);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);
  // 计算剪刀位置
  const cutterPosition = computed(() => {
    return (cutPosition.value / videoDuration.value) * 100;
  });
  // 生成时间刻度数据
  const rulerMarks = computed(() => {
    if (videoDuration.value === 0) return [];

    let interval: number;

    if (videoDuration.value <= 30) {
      interval = 5;
    } else if (videoDuration.value <= 120) {
      interval = 10;
    } else if (videoDuration.value <= 600) {
      interval = 30;
    } else if (videoDuration.value <= 3600) {
      interval = 60;
    } else {
      interval = 300;
    }

    const marks: Array<{ time: number; position: number; label: string }> = [];

    const maxMarks = 20;

    const calculatedInterval = Math.max(
      interval,
      Math.ceil(videoDuration.value / maxMarks),
    );

    for (
      let time = 0;
      time <= videoDuration.value;
      time += calculatedInterval
    ) {
      const position = (time / videoDuration.value) * 100;
      marks.push({
        time,
        position,
        label: formatTime(time),
      });
    }

    if (
      marks.length === 0 ||
      marks[marks.length - 1].time < videoDuration.value
    ) {
      marks.push({
        time: videoDuration.value,
        position: 100,
        label: formatTime(videoDuration.value),
      });
    }

    return marks;
  });

  const addToHistory = (type: "cut" | "delete" | "restore") => {
    history.value = history.value.slice(0, historyIndex.value + 1);

    history.value.push({
      type,
      segments: JSON.parse(JSON.stringify(segments.value)),
      timestamp: Date.now(),
    });

    historyIndex.value = history.value.length - 1;
  };

  const cutVideo = () => {
    if (segments.value.length === 0) return;

    const targetSegmentIndex = segments.value.findIndex(
      (seg) =>
        !seg.deleted &&
        cutPosition.value > seg.startTime &&
        cutPosition.value < seg.endTime,
    );

    if (targetSegmentIndex === -1) {
      return;
    }

    const targetSegment = segments.value[targetSegmentIndex];

    const newSegments = [...segments.value];

    newSegments.splice(
      targetSegmentIndex,
      1,
      {
        id: generateId(),
        startTime: targetSegment.startTime,
        endTime: cutPosition.value,
        deleted: false,
      },
      {
        id: generateId(),
        startTime: cutPosition.value,
        endTime: targetSegment.endTime,
        deleted: false,
      },
    );

    segments.value = newSegments;

    addToHistory("cut");

    return true;
  };

  const deleteSegment = () => {
    if (!selectedSegmentId.value) return;

    const segmentIndex = segments.value.findIndex(
      (s) => s.id === selectedSegmentId.value,
    );

    if (segmentIndex !== -1) {
      segments.value[segmentIndex].deleted = true;

      addToHistory("delete");

      selectedSegmentId.value = null;

      editMode.value = EditMode.INITIAL;
    }
  };

  const undo = () => {
    if (!canUndo.value) return;

    historyIndex.value--;

    if (historyIndex.value === -1) {
      segments.value = [
        {
          id: generateId(),
          startTime: 0,
          endTime: videoDuration.value,
          deleted: false,
        },
      ];
    } else {
      segments.value = JSON.parse(
        JSON.stringify(history.value[historyIndex.value].segments),
      );
    }

    selectedSegmentId.value = null;
  };

  const redo = () => {
    if (!canRedo.value) return;

    historyIndex.value++;

    segments.value = JSON.parse(
      JSON.stringify(history.value[historyIndex.value].segments),
    );

    selectedSegmentId.value = null;
  };

  const restore = () => {
    segments.value = [
      {
        id: generateId(),
        startTime: 0,
        endTime: videoDuration.value,
        deleted: false,
      },
    ];

    historyIndex.value = -1;

    history.value = [];
  };

  const selectSegment = (segmentId: string) => {
    const segment = segments.value.find((s) => s.id === segmentId);

    if (segment && !segment.deleted) {
      selectedSegmentId.value = segmentId;
    }
  };

  const setCutPosition = (position: number) => {
    cutPosition.value = Math.max(0, Math.min(position, videoDuration.value));
  };

  const initVideoWithFrames = (url: string) => {
    initVideo(url, () => {
      setTimeout(() => {
        generateVideoFrames();
      }, 100);
    });
  };

  const selectFirstSegment = () => {
    if (segments.value.length > 0) {
      const firstSegment = segments.value[0];

      selectSegment(firstSegment.id);

      setCutPosition(firstSegment.startTime);
    }
  };

  const startDragCutter = (event: MouseEvent) => {
    isDraggingCutter.value = true;

    event.preventDefault();

    if (videoRef.value && isPlaying.value) {
      videoRef.value.pause();
    }
  };

  const isTimeInDeletedSegment = (time: number) => {
    return segments.value.some(
      (s) => s.deleted && time >= s.startTime && time <= s.endTime,
    );
  };

  const onDragCutter = (event: MouseEvent) => {
    if (!isDraggingCutter.value || !timelineRef.value) return;

    const rect = timelineRef.value.getBoundingClientRect();

    const x = event.clientX - rect.left;

    const percentage = Math.max(0, Math.min(1, x / rect.width));

    const time = percentage * videoDuration.value;

    setCutPosition(time);

    videoRef.value && (videoRef.value.currentTime = time);
  };

  const stopDragCutter = () => {
    isDraggingCutter.value = false;
  };

  const handleSegmentClick = (segmentId: string, event: MouseEvent) => {
    const segment = segments.value.find((s) => s.id === segmentId);

    if (segment && !segment.deleted) {
      if (selectedSegmentId.value === segmentId) {
        selectedSegmentId.value = null;
      } else {
        selectSegment(segmentId);
      }
    }

    event.stopPropagation();
  };

  const handleCut = () => {
    const success = cutVideo();

    if (success) {
      selectedSegmentId.value = null;
    } else {
      ElMessage.info("當前位置無法切割");
    }
  };

  const handleDelete = () => {
    if (!selectedSegmentId.value) {
      return;
    }

    const segment = segments.value.find(
      (s) => s.id === selectedSegmentId.value,
    );

    if (segment && !segment.deleted) {
      deleteSegment();
    }
  };

  const updateCutterPosition = () => {
    if (!isDraggingCutter.value) {
      setCutPosition(currentTime.value);
    }
  };

  const getValidSegments = () => {
    return segments.value
      .filter((s) => !s.deleted)
      .sort((a, b) => a.startTime - b.startTime);
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.value || !isPlaying.value || isJumping.value) return;

    const currentTime = videoRef.value.currentTime;

    const validSegments = getValidSegments();

    let currentSegmentIndex = -1;

    for (let i = 0; i < validSegments.length; i++) {
      const seg = validSegments[i];

      if (
        currentTime >= seg.startTime - TIME_TOLERANCE &&
        currentTime < seg.endTime - TIME_TOLERANCE
      ) {
        currentSegmentIndex = i;

        currentPlayingSegmentIndex.value = i;

        break;
      }
    }

    if (currentSegmentIndex === -1) {
      const nextSegment = validSegments.find(
        (s) => s.startTime > currentTime + TIME_TOLERANCE,
      );

      if (nextSegment) {
        isJumping.value = true;

        const targetTime = nextSegment.startTime + TIME_TOLERANCE;

        videoRef.value.currentTime = targetTime;

        setTimeout(() => {
          isJumping.value = false;
        }, 200);
      } else {
        videoRef.value.pause();

        videoRef.value.currentTime =
          validSegments[0].startTime + TIME_TOLERANCE;
      }
      return;
    }

    const currentSegment = validSegments[currentSegmentIndex];

    if (currentTime >= currentSegment.endTime - TIME_TOLERANCE * 2) {
      if (currentSegmentIndex < validSegments.length - 1) {
        isJumping.value = true;

        const nextSegment = validSegments[currentSegmentIndex + 1];

        const targetTime = nextSegment.startTime + TIME_TOLERANCE;

        videoRef.value.currentTime = targetTime;

        setTimeout(() => {
          isJumping.value = false;
        }, 200);
      } else {
        videoRef.value.pause();

        videoRef.value.currentTime =
          validSegments[0].startTime + TIME_TOLERANCE;
      }
    }
  };

  const handleVideoClick = () => {
    if (!videoRef.value) return;

    if (isPlaying.value) {
      videoRef.value.pause();
    } else {
      const validSegments = getValidSegments();

      if (validSegments.length === 0) {
        return;
      }

      const currentTime = videoRef.value.currentTime;

      const isInValidSegment = validSegments.some(
        (s) =>
          currentTime >= s.startTime - TIME_TOLERANCE &&
          currentTime < s.endTime - TIME_TOLERANCE,
      );

      if (!isInValidSegment) {
        const targetTime = validSegments[0].startTime + TIME_TOLERANCE;

        videoRef.value.currentTime = targetTime;
      }

      videoRef.value.play();
    }
  };

  const handleExport = useDebounceFn(() => {
    const loading = ElLoading.service({
      lock: true,
      text: "处理中...",
    });

    const validSegments =
      segments.value
        ?.filter((s) => !s.deleted)
        ?.map((segment) => ({
          startTime: segment.startTime,
          endTime: segment.endTime,
          duration: segment.endTime - segment.startTime,
        })) ?? [];

    const times = validSegments?.map((seg) => ({
      startTime: Number(seg.startTime.toFixed(0)),
      endTime: Number(seg.endTime.toFixed(0)),
    }));

    recordCut({
      meetingName: props.meetingNumber,
      title: props.title,
      url: props.videoUrl,
      recordId: props.meetingRecordId,
      meetingId: props.meetingId,
      times,
    })
      .then((res) => {
        if (!res?.code || res?.code !== 200) {
          throw "编辑失败";
        }

        ElMessage.success("编辑成功");

        model.value = false;
      })
      .catch(() => {
        ElMessage.error("编辑失败");
      })
      .finally(() => {
        loading.close();
      });
  }, 300);

  const getSegmentStyle = (segment: any) => {
    const width =
      ((segment.endTime - segment.startTime) / videoDuration.value) * 100;

    return {
      width: `${width}%`,
    };
  };

  const getSegmentBackgroundStyle = (segment: VideoSegment) => {
    if (!timelineBackgroundImage.value || videoDuration.value === 0) {
      return {};
    }

    const segmentStartRatio = segment.startTime / videoDuration.value;

    const segmentEndRatio = segment.endTime / videoDuration.value;

    const segmentDurationRatio = segmentEndRatio - segmentStartRatio;

    const w =
      segmentDurationRatio == 1 || segmentStartRatio == 0
        ? 0
        : segmentStartRatio * timelineRef.value!.offsetWidth;

    return {
      backgroundImage: `url(${timelineBackgroundImage.value})`,
      backgroundPositionX: `-${w}px`,
      backgroundRepeat: "no-repeat",
    };
  };

  // 生成完整时间轴背景图
  const generateTimelineBackground = async () => {
    if (videoFrames.value.length === 0) {
      return;
    }

    isGeneratingBackground.value = true;

    try {
      const canvas = document.createElement("canvas");

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("无法创建 Canvas 上下文");
      }

      const timelineWidth = timelineRef.value?.offsetWidth || 1000;

      const frameHeight = 81;

      const frameWidth = Math.floor((16 / 9) * frameHeight);

      const idealFrameCount = Math.ceil(timelineWidth / frameWidth);

      const framesToUse = Math.min(idealFrameCount, videoFrames.value.length);

      const selectedFrames: typeof videoFrames.value = [];

      if (framesToUse >= videoFrames.value.length) {
        selectedFrames.push(...videoFrames.value);
      } else {
        const step = videoFrames.value.length / framesToUse;

        for (let i = 0; i < framesToUse; i++) {
          const index = Math.floor(i * step);

          selectedFrames.push(videoFrames.value[index]);
        }
      }

      const totalWidth = frameWidth * selectedFrames.length;

      canvas.width = totalWidth;

      canvas.height = frameHeight;

      ctx.fillStyle = "#2a2a2a";

      ctx.fillRect(0, 0, totalWidth, frameHeight);

      const loadImagePromises = selectedFrames.map((frame, index) => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();

          img.onload = () => {
            const xPosition = index * frameWidth;

            ctx.drawImage(img, xPosition, 0, frameWidth, frameHeight);

            resolve();
          };

          img.onerror = () => {
            reject(new Error(`加载帧 ${index} 失败`));
          };

          img.src = frame.imageData;
        });
      });

      await Promise.all(loadImagePromises);

      const backgroundImage = canvas.toDataURL("image/jpeg", 0.9);

      timelineBackgroundImage.value = backgroundImage;
    } catch (error: any) {
      timelineBackgroundImage.value = "";
    } finally {
      isGeneratingBackground.value = false;
    }
  };

  // 使用 ffmpeg 生成视频帧
  const generateVideoFrames = async () => {
    if (isLoadingFrames.value) return;

    if (!window.electronAPI?.extractVideoKeyframes) {
      videoFrames.value = [];

      selectFirstSegment();

      return;
    }

    isLoadingFrames.value = true;

    try {
      if (!videoUrl.value || !videoUrl.value.trim()) {
        throw new Error("视频URL无效");
      }

      const frameHeight = 81;

      const frameWidth = Math.floor((16 / 9) * frameHeight);

      const frameCount = 30;

      const frames = await window.electronAPI.extractVideoKeyframes(
        videoUrl.value,
        frameCount,
        frameWidth,
        frameHeight,
      );

      if (!frames || !Array.isArray(frames) || frames.length === 0) {
        throw new Error("未提取到任何关键帧");
      }

      videoFrames.value = frames;

      console.log(`✅ ffmpeg 成功提取 ${frames.length} 个关键帧`);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await generateTimelineBackground();

      selectFirstSegment();
    } catch (error: any) {
      console.error("❌ 使用 ffmpeg 生成视频帧失败:", error);

      videoFrames.value = [];

      selectFirstSegment();
    } finally {
      isLoadingFrames.value = false;
    }
  };

  // 初始化视频
  const initVideo = (url: string, onMetadataLoaded?: () => void) => {
    if (!videoRef.value) {
      return;
    }

    videoUrl.value = url;

    videoRef.value.src = url;

    videoRef.value.onloadedmetadata = () => {
      videoDuration.value = videoRef.value!.duration;
      segments.value = [
        {
          id: generateId(),
          startTime: 0,
          endTime: videoDuration.value,
          deleted: false,
        },
      ];

      cutPosition.value = 0;

      onMetadataLoaded && onMetadataLoaded?.();
    };

    videoRef.value.onerror = (e) => {
      console.error("视频加载失败:", e);
    };
  };

  // 处理窗口大小变化
  const handleResize = useDebounceFn(() => {
    if (videoFrames.value.length > 0 && !isGeneratingBackground.value) {
      generateTimelineBackground();
    }
  }, 300);

  // 更新剪刀位置
  const {
    pause: updateCutterPositionPause,
    resume: updateCutterPositionResume,
  } = useTimeoutPoll(() => {
    if (videoRef.value && !isDraggingCutter.value && isPlaying.value) {
      updateCutterPosition();
    }
  }, 100);

  onMounted(() => {
    document.addEventListener("mousemove", onDragCutter);

    document.addEventListener("mouseup", stopDragCutter);

    updateCutterPositionResume();

    window.addEventListener("resize", handleResize);

    return () => {
      updateCutterPositionPause();

      window.removeEventListener("resize", handleResize);

      document.removeEventListener("mousemove", onDragCutter);

      document.removeEventListener("mouseup", stopDragCutter);
    };
  });

  onMounted(() => {
    inputUrl.value = props.videoUrl;

    videoFrames.value = [];

    isLoadingFrames.value = false;

    initVideoWithFrames(inputUrl.value);
  });

  return {
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
    canUndo,
    canRedo,
    cutterPosition,
    timelineBackgroundImage,
    isGeneratingBackground,
    rulerMarks,
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
    generateTimelineBackground,
    initVideo,
    isTimeInDeletedSegment,
  };
};
