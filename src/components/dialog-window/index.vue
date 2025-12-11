<script setup lang="ts">
import CloseIcon from "@icon/close/index.vue";
import { ElMessage } from "element-plus";
import { isNil } from "lodash";
import { onMounted, ref, toRaw } from "vue";

const props = defineProps<{
  formData?: any;
}>();

const emits = defineEmits<{
  (event: "onBeforeClose"): Promise<boolean>;
  (event: "onBeforeConfirm"): Promise<boolean>;
}>();

const queryData = ref<any>();

const onClose = async (path?: string) => {
  const result = await emits("onBeforeClose");

  if (!isNil(result)) return;

  queryData.value = undefined;

  await window.windowControl.close(path);
};

const onConfirm = async (path?: string) => {
  const result = await emits("onBeforeConfirm");

  if (!isNil(result)) return;

  try {
    JSON.parse(JSON.stringify(props.formData));

    queryData.value = toRaw(props.formData);

    await window.windowControl.close(path);
  } catch {
    ElMessage({
      type: "error",
      message: "An object could not be cloned",
    });
  }
};

onMounted(() => {
  window.winEvents.onClose(async () => {
    window.channelMessaging.onSendMessage(toRaw(queryData.value));
  });
});

defineExpose({
  onConfirm,
  onClose,
});
</script>

<template>
  <div class="dialog-window-container">
    <slot name="header">
      <div class="dialog-window-header">
        <span>選擇參會人</span>
        <el-icon @click="() => onClose()"><close-icon /></el-icon>
      </div>
    </slot>
    <div class="dialog-window-content">
      <slot></slot>
    </div>
    <slot name="footer">
      <div class="dialog-window-footer">
        <el-button size="default" type="primary" @click="() => onConfirm()">
          確認
        </el-button>
      </div>
    </slot>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
