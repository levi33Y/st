<script setup lang="ts">
import Avatar from "@components/avatar/index.vue";
import Header from "@components/header/index.vue";
import Search from "@icon/search/index.vue";
import { isNil } from "lodash";
import CommonDialog from "../../components/common-dialog/index.vue";
import {
  FeedbackTypeConst,
  FeedbackTypeEnum,
} from "../../services/apis/feedback/types";
import { useAction } from "./hook";

const {
  appStore,
  state,
  feedbackListState,
  feedbackDetailDialogState,
  onReadingLabel,
  onFeedbackDetail,
  onSearch,
  onExportList,
} = useAction();
</script>

<template>
  <Header :hide-maximizable="true" :is-destroy="true" />
  <div class="container">
    <div class="container-header">
      <img
        class="app-logo"
        src="../../assets/images/sugarTalkLogo.png"
        style="height: 1.8rem"
      />
      <Avatar :size="36" :name="appStore.userName" />
    </div>
    <div class="header-filter">
      <span class="filter-title">問題列表</span>
      <div class="filter-options">
        <el-input
          v-model="state.keyWord"
          class="intelligent-select"
          @input="onSearch"
          placeholder="搜索提出人"
          style="width: 242px"
        >
          <template #suffix>
            <el-icon size="22" @click="() => onSearch()"><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" plain @click="onExportList()">
          <i class="iconfont icon-export" />
          導出
        </el-button>
      </div>
    </div>
    <el-table
      :data="feedbackListState.dataList"
      style="width: 100%"
      max-height="calc(100vh - 250px)"
      v-loading="state.loading"
    >
      <el-table-column prop="userName" label="提出人" width="120" />
      <el-table-column prop="types" label="類別" width="240">
        <template #default="{ row }">
          <span
            v-for="(item, index) in row.types"
            :key="index"
            :class="['feedback-type', onReadingLabel(item)]"
          >
            {{ FeedbackTypeConst[item as FeedbackTypeEnum] }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="describe" label="描述">
        <template #default="{ row }">
          <div class="line-clamp-1">
            {{ row?.describe }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新時間" width="240" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            @click="() => onFeedbackDetail(row)"
          >
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="feedbackListState.count"
      background
      layout="->,prev, pager, next"
      :total="feedbackListState.count"
      :current-page="state.page"
      :page-size="10"
      @current-change="(page: number) => (state.page = page)"
      class="footer-filter"
    />
  </div>
  <CommonDialog
    v-model:visible="feedbackDetailDialogState.visible"
    :show-bottom="false"
  >
    <template #header>問題詳情</template>
    <div class="detail-main">
      <div class="main-item">
        <div class="main-label" style="color: var(--color-black)">
          {{ feedbackDetailDialogState.userName }}
        </div>
        <span class="main-content">
          {{ feedbackDetailDialogState.updateTime }}
        </span>
      </div>
      <div class="main-item">
        <span class="main-label">問題類型：</span>
        <span
          v-if="!isNil(feedbackDetailDialogState.types)"
          class="main-content"
          style="color: var(--color-primary)"
        >
          {{
            feedbackDetailDialogState.types
              ?.map((item: FeedbackTypeEnum) => FeedbackTypeConst[item])
              .join("、")
          }}
        </span>
      </div>
      <div class="main-item">
        <span class="main-label">問題描述：</span>
        <el-scrollbar
          class="main-content"
          style="color: var(--color-black)"
          height="calc(100vh - 600px)"
        >
          {{ feedbackDetailDialogState.describe }}
        </el-scrollbar>
      </div>
    </div>
  </CommonDialog>
</template>

<style scoped lang="scss">
@use "./index";
</style>
