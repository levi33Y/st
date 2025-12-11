<script setup lang="ts">
import { useAction } from "./hooks";
import Avatar from "@components/avatar/index.vue";
import DialogWindow from "@components/dialog-window/index.vue";
import { Search } from "@element-plus/icons-vue";
import CloseIcon from "@icon/close/index.vue";

const {
  appStore,
  searchValue,
  participantFilter,
  formListData,
  participantList,
  formData,
  onCancelListItem,
  onSelectHost,
} = useAction();
</script>

<template>
  <dialog-window :formData="formData">
    <div class="container">
      <div class="transfer-pre">
        <el-input
          placeholder="搜索"
          :suffix-icon="Search"
          v-model="searchValue"
        />
        <el-scrollbar>
          <div
            class="host-list-item"
            v-if="
              !searchValue ||
              appStore?.userInfo?.userName
                ?.toLowerCase()
                ?.includes(searchValue?.toLowerCase())
            "
          >
            <el-checkbox :disabled="true" />
            <div><avatar :size="32" :name="appStore.userInfo.userName" /></div>
            {{ appStore.userInfo.userName }}
          </div>
          <div
            class="host-list-item"
            v-for="(item, index) in participantFilter"
            :key="index"
          >
            <el-checkbox
              v-model="participantList[index].value"
              @change="onSelectHost($event, index)"
            />
            <div><avatar :size="32" :name="item.name" /></div>
            {{ item.name }}
          </div>
        </el-scrollbar>
      </div>
      <div />
      <el-scrollbar>
        <div>
          <slot name="sub-title">已選擇 {{ formListData.length }}</slot>
          <el-scrollbar>
            <div class="form-list-item" v-for="item in formListData">
              <avatar :size="32" :name="item.name" />
              <span>{{ item.name }}</span>
              <el-icon :size="16" @click="onCancelListItem(item.id)">
                <close-icon />
              </el-icon>
            </div>
          </el-scrollbar>
        </div>
      </el-scrollbar>
    </div>
  </dialog-window>
</template>

<style scoped lang="scss">
@use "index";
</style>
