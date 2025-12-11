<template>
  <div class="speaking">
    <div class="text">正在講話：</div>
    <TransitionGroup name="speaking">
      <div class="text active" v-for="speaker in speakers" :key="speaker">
        {{ ` ${speaker} ` }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
interface Props {
  speakers: string[];
}

const { speakers } = defineProps<Props>();
</script>

<style scoped lang="scss">
@use "./index";
</style>
