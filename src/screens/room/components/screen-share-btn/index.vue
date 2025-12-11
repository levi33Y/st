<script setup lang="ts">
import ShareScreenIcon from "@icon/share-screen/index.vue";
import ActionBtn from "../action-btn/index.vue";

const isShare = defineModel({ default: false });

const emits = defineEmits<{
  (event: "switch"): void;
}>();

const onClick = () => {
  emits("switch");
};
</script>

<template>
  <action-btn
    :title="isShare ? '結束共享' : '共享屏幕'"
    icon=""
    @click="onClick"
  >
    <el-icon size="32" :color="isShare ? '#36cf70' : '#5A5B6D'">
      <share-screen-icon />
    </el-icon>
  </action-btn>
</template>

<style scoped lang="scss"></style>
