<template>
  <Header :is-destroy="true" />
  <div class="container">
    <div class="container-header">
      <el-icon size="2.24rem"><Logo /></el-icon>
      <Avatar :size="36" :name="appStore.userName"></Avatar>
    </div>
    <div class="intelligent-Filters">
      <span>錄製</span>
      <div>
        <el-select
          v-model="selectValue"
          class="intelligent-select"
          placeholder="Select"
          style="width: 142px"
        >
          <el-option
            v-for="item in selectKeyWords"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input
          v-model="inputValue"
          class="intelligent-select"
          @change="onSearch"
          placeholder="請輸入搜索關鍵字"
          style="width: 242px"
        >
          <template #suffix>
            <el-icon class="search-icon" @click="onSearch">
              <Search />
            </el-icon>
          </template>
        </el-input>

        <el-button
          :type="selectMeetingIds.length > 0 ? 'primary' : 'info'"
          plain
          @click="multipleDownload"
          :disabled="!(selectMeetingIds.length > 0)"
        >
          <i class="iconfont icon-export" />
          導出
        </el-button>
        <el-button
          :type="selectMeetingIds.length > 0 ? 'danger' : 'info'"
          plain
          @click="multipleDelIntelligent"
          :disabled="!(selectMeetingIds.length > 0)"
        >
          <i class="iconfont icon-delete2" />
          刪除
        </el-button>
      </div>
    </div>
    <el-table
      :data="tableData"
      @selection-change="getSelectData"
      style="width: 100%"
      :max-height="tableHeight"
    >
      <el-table-column type="selection" minWidth="36" />
      <!-- <el-table-column prop="sort" label="序號" minWidth="70" /> -->
      <el-table-column prop="recordNumber" label="記錄編號" minWidth="223" />
      <el-table-column prop="title" label="會議主題" minWidth="190" />
      <el-table-column prop="meetingNumber" label="會議號" minWidth="167" />
      <el-table-column prop="meetingCreator" label="創建人" minWidth="93" />
      <el-table-column prop="timezone" label="時區" minWidth="270" />
      <el-table-column prop="startTime" label="開始時間" minWidth="180" />
      <el-table-column prop="endTime" label="結束時間" minWidth="180" />
      <el-table-column
        prop="formattedDuration"
        label="時長(分秒)"
        minWidth="120"
      />
      <el-table-column fixed="right" label="操作" minWidth="170">
        <template #default="scope">
          <div class="intelligent-option">
            <el-icon size="18" @click="onIntelligentDetail(scope.row)">
              <browse-icon />
            </el-icon>

            <el-tooltip
              class="box-item"
              effect="dark"
              content="複製鏈接"
              placement="top"
            >
              <el-icon size="18" @click="copyRecordLink(scope.row)">
                <link-icon />
              </el-icon>
            </el-tooltip>

            <el-dropdown trigger="click">
              <el-icon size="18" style="cursor: pointer">
                <ellipsis-icon />
              </el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    @click="download(scope.row.url, scope.row.urlStatus)"
                  >
                    <div style="width: 121px">導出</div>
                  </el-dropdown-item>
                  <el-dropdown-item
                    @click="delIntelligent(scope.row.meetingRecordId)"
                  >
                    刪除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="tableData.length"
      class="page"
      background
      layout="prev, pager, next"
      :total="pagination.total"
      :current-page="pagination.current"
      :page-size="pagination.pageSize"
      @current-change="pageChange"
    />
    <ConfirmDialog
      isDelMeeting
      :visible="isDel"
      @onCancel="cancelDel"
      @onConfirm="confirmDel"
    />
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import BrowseIcon from "@icon/browse/index.vue";
import EllipsisIcon from "@icon/ellipsis/index.vue";
import LinkIcon from "@icon/link/index.vue";
import Logo from "@icon/logo/index.vue";
import Avatar from "../../components/avatar/index.vue";
import ConfirmDialog from "../../components/confirm-dialog/index.vue";
import Header from "../../components/header/index.vue";
import { useAction } from "./hooks";

const {
  tableData,
  onIntelligentDetail,
  delIntelligent,
  multipleDelIntelligent,
  getSelectData,
  appStore,
  pageChange,
  pagination,
  isDel,
  selectKeyWords,
  selectValue,
  selectMeetingIds,
  inputValue,
  tableHeight,
  cancelDel,
  confirmDel,
  getRecordList,
  download,
  multipleDownload,
  onSearch,
  copyRecordLink,
} = useAction();
</script>

<style scoped lang="scss">
@use "./index";
</style>
