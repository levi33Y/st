<script setup lang="ts">
import CommonDialog from "../../../../components/common-dialog/index.vue";
import { FeedbackTypeConst } from "../../../../services/apis/feedback/types";
import { useAction } from "./hook";

const {
  problemFormRef,
  state,
  problemForm,
  appInfo,
  onSubmitForm,
  onFeedbackList,
  onCheckUpdate,
} = useAction();
</script>

<template>
  <div class="settings-about-us">
    <img src="../../../../assets/images/sugarTalkLogo.png" class="app-avatar" />
    <p v-if="appInfo?.name" class="app-name">{{ appInfo.name }}</p>
    <p v-if="appInfo?.version" class="app-version">V {{ appInfo.version }}</p>
    <el-skeleton
      style="width: 9rem"
      :loading="state.skeletonLoading"
      animated
      class="option-skeleton"
    >
      <template #template>
        <el-skeleton-item variant="button" style="width: 100%" />
        <el-skeleton-item variant="button" style="width: 100%" />
      </template>
      <template #default>
        <el-button
          type="primary"
          class="option-dialog"
          @click="() => (state.feedbackDialogVisible = true)"
        >
          問題反饋
        </el-button>
        <el-badge
          v-if="state.isMarketPlayer"
          :show-zero="false"
          :value="state.listBadge"
          class="option-badge"
        >
          <el-button @click="() => onFeedbackList()">問題列表</el-button>
        </el-badge>
        <el-button class="option-update" @click="() => onCheckUpdate()">
          檢查更新
        </el-button>
      </template>
    </el-skeleton>
  </div>

  <common-dialog
    v-model:visible="state.feedbackDialogVisible"
    class="common-dialog"
    @close="
      () => {
        problemForm.types = [];
        problemForm.content = '';
      }
    "
  >
    <template #header>問題反饋</template>
    <div class="dialog-main">
      <el-form :model="problemForm" label-position="top" ref="problemFormRef">
        <el-form-item
          label="問題類型"
          prop="types"
          style="font-weight: var(--font-weight-primary)"
          :rules="[{ required: true, message: '請選擇問題類型' }]"
        >
          <template #default>
            <div class="main-option">
              <el-button
                v-for="[value, title] in Object.entries(FeedbackTypeConst)"
                :type="
                  problemForm.types.includes(~~value) ? 'primary' : 'default'
                "
                @click="
                  () =>
                    problemForm.types.includes(~~value)
                      ? problemForm.types.splice(
                          problemForm.types.indexOf(~~value),
                          1,
                        )
                      : problemForm.types.push(~~value)
                "
                style="margin: 0"
              >
                {{ title }}
              </el-button>
            </div>
          </template>
        </el-form-item>
        <el-form-item label="問題描述（選填）:" prop="content">
          <el-input
            v-model="problemForm.content"
            type="textarea"
            placeholder="請詳細描述問題，有助於我們定位問題，不超過200字"
            maxlength="200"
            :rows="4"
            resize="none"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="() => (state.feedbackDialogVisible = false)">
          取消
        </el-button>
        <el-button
          :loading="problemForm.submitLoading"
          type="primary"
          @click="() => onSubmitForm()"
        >
          確定
        </el-button>
      </div>
    </template>
  </common-dialog>
</template>

<style scoped lang="scss">
@use "./index";
</style>
