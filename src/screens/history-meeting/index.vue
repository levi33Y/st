<template>
  <Header title="历史會議" :hide-maximizable="true" :is-destroy="true" />
  <div class="container">
    <el-input
      class="search-meeting"
      v-model="searchMeeting"
      @input="searchMeetingChange"
      placeholder="會議主題、會議號、創建人"
      :prefix-icon="Search"
    ></el-input>
    <el-scrollbar height="550px">
      <div
        class="screen-share-body"
        v-infinite-scroll="handleScroll"
        infinite-scroll-distance="180"
        infinite-scroll-delay="500"
      >
        <div
          class="meeting-list"
          v-for="(item, index) in lastMeetListData"
          :key="index"
        >
          <div class="meeting-list-date">
            <span class="month">{{ item.historyMonth }}</span>
            <span class="year">{{ item.historyYear }}</span>
          </div>
          <div
            class="meeting-list-content"
            v-for="(content, index) in item.historyMeetingsContent"
            :key="index"
          >
            <p class="history-number">{{ content.meetingNumber }}</p>
            <div class="history-title-content">
              <p class="title">{{ content.title }}</p>
              <el-button
                class="meeting-detail"
                size="small"
                type="primary"
                @click="onMeetingDetail(content)"
                plain
                round
              >
                詳情
              </el-button>
            </div>
            <div class="history-message">
              <span class="time">
                時長:{{ formatDuration(content.duration) }}
              </span>
              <span class="founder">創建人:{{ content.meetingCreator }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>
<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import Header from "../../components/header/index.vue";
import { formatDuration } from "../../utils/utils";
import { useAction } from "./hooks";

const {
  historyMeetList,
  searchMeeting,
  scrollContainer,
  searchMeetingChange,
  lastMeetListData,
  onMeetingDetail,
  handleScroll,
} = useAction();
</script>

<style scoped lang="scss">
@use "./index";
</style>
