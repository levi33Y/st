<script setup lang="ts">
import Avatar from "@components/avatar/index.vue";
import DialogWindow from "@components/dialog-window/index.vue";
import { Search } from "@element-plus/icons-vue";
import CloseIcon from "@icon/close/index.vue";
import { defaultProps } from "element-plus/es/components/select-v2/src/useProps";
import { useAction } from "./hooks";
import { ITreeDataProps } from "./props";

const {
  treeRef,
  treeFilterValue,
  formListData,
  treeData,
  handleFilterNode,
  onCancelListItem,
  onClose,
  onConfirm,
} = useAction();
</script>

<template>
  <dialog-window class="meeting-invitation-container">
    <template #header>
      <div class="container-header">
        添加參會人
        <el-icon class="close-icon" :size="25" @click="() => onClose()">
          <close-icon />
        </el-icon>
      </div>
    </template>

    <template #footer>
      <div class="container-footer">
        <el-button size="large" @click="() => onClose()">取消</el-button>
        <el-button
          size="large"
          type="primary"
          @click="() => onConfirm()"
          :disabled="formListData.length === 0"
        >
          確認
        </el-button>
      </div>
    </template>

    <div class="container">
      <div class="transfer-pre">
        <span>OPERATION INC.</span>
        <el-input
          placeholder="請輸入內容"
          :suffix-icon="Search"
          v-model="treeFilterValue"
        />
        <el-scrollbar>
          <el-tree
            ref="treeRef"
            show-checkbox
            node-key="id"
            :data="treeData"
            :props="defaultProps"
            @check="
              (_: any, treeState: any) =>
                (formListData = treeState.checkedNodes.filter(
                  (item: ITreeDataProps) => item.isStaff,
                ))
            "
            :filter-node-method="handleFilterNode"
          >
            <template #default="{ node }">
              <div class="tree-node">
                <avatar
                  :size="36"
                  :name="node.label"
                  :src="node.data?.avatarUrl"
                />
                {{ node.label }}
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>
      <div />
      <div>
        <slot name="sub-title">已選擇 {{ formListData.length }}</slot>
        <el-scrollbar>
          <div class="form-list-item" v-for="item in formListData">
            <avatar :size="32" :name="item.label" :src="item.avatarUrl" />
            <span>{{ item.label }}</span>
            <el-icon :size="16" @click="onCancelListItem(item.id)">
              <close-icon />
            </el-icon>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </dialog-window>
</template>

<style scoped lang="scss">
@use "index";
</style>
