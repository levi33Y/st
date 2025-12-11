<template>
  <ActionBtn
    v-loading="loading"
    :title="isRecording ? '關閉錄製' : '錄製'"
    :iconColor="iconColor"
    :moderator-disabled="disable"
    icon="icon-record"
    @click="onClick"
  >
    <el-icon size="32" :color="`${isRecording ? 'red' : '#5A5B6D'}`">
      <Recording-icon />
    </el-icon>
  </ActionBtn>
</template>

<script setup lang="ts">
import RecordingIcon from "@icon/recording/index.vue";
import { useDebounceFn } from "@vueuse/core";
import { computed, ref, toRefs } from "vue";
import { useAppStore } from "../../../../stores/useAppStore";
import ActionBtn from "../action-btn/index.vue";

interface Props {
  isRecording: boolean;
  disable?: boolean;
  update?: () => Promise<void>;
}

const props = defineProps<Props>();

const appStore = useAppStore();

const { isRecording } = toRefs(props);

const loading = ref(false);

const iconColor = computed(() =>
  props.isRecording ? "color:#F3333E" : "color:#5b5b6c",
);

const onClick = useDebounceFn(async () => {
  try {
    loading.value = true;

    await props?.update?.();
  } finally {
    loading.value = false;
  }
}, 300);
</script>
