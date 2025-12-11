<script setup lang="ts">
import { ISummaryTextProps } from "../../props";

defineProps({
  summaryData: {
    type: Object as () => ISummaryTextProps,
    default: () => ({
      topics: [],
      actionItems: [],
    }),
  },
  visible: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="intelligent-summary" v-show="visible">
    <h3 class="summary-title">會議摘要</h3>
    <div class="summary-content">
      <div
        class="summary-abstract summary-text"
        v-for="item in summaryData.abstract"
      >
        <div class="abstract-title">{{ item?.abstractTitle }}</div>
        <div>{{ item?.abstractContent }}</div>
      </div>
    </div>
    <h3 class="summary-title">會議待辦</h3>
    <div class="summary-content">
      <div class="summary-todo" v-for="item in summaryData.meetingTodoItems">
        <div class="todo-point" />
        <div class="summary-text">{{ item }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "./index";
</style>
