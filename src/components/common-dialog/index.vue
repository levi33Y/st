<script setup lang="ts">
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  showBottom: {
    type: Boolean,
    default: true,
  },
});

const emits = defineEmits(["update:visible", "close"]);
</script>

<template>
  <div class="container">
    <el-dialog
      :model-value="props.visible"
      width="500px"
      center
      destroy-on-close
      align-center
      @close="
        () => {
          emits('update:visible', false);

          emits('close');
        }
      "
    >
      <template #header>
        <div class="header-title">
          <slot name="header" />
        </div>
      </template>

      <slot />

      <template #footer>
        <div class="footer-option" v-if="props.showBottom">
          <slot name="footer" />
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use "./index.scss";
</style>
