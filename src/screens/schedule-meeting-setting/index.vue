<script setup lang="ts">
import Header from "@components/header/index.vue";
import ChevronRightIcon from "@icon/chevron-right-s/index.vue";
import CopyIcon from "@icon/copy/index.vue";
import HelpCircle from "@icon/help-circle/index.vue";
import { useAction } from "./hooks";

const {
  state,
  participantInfo,
  onOpenScheduleMeetingHost,
  onOpenUserPassword,
  onSwitchPassword,
  onCopyMeeting,
  onSubmit,
  onClose,
} = useAction();
</script>

<template>
  <div :class="[state.isModel ? 'modal-style' : '']" />
  <Header
    title="會議設置"
    :hide-maximizable="true"
    :hide-minimizable="true"
    :is-inner="state.isModel"
    :close="onClose"
  />
  <div class="container">
    <div class="setting-list">
      <div class="setting-item">
        <div class="item-label">
          指定主持人
          <el-tooltip
            content="指定參與人為主持人，當你不在會議中，該成員將優先成為主持人"
          >
            <el-icon><help-circle /></el-icon>
          </el-tooltip>
        </div>
        <div class="item-option">
          {{ participantInfo }}
          <el-icon @click="onOpenScheduleMeetingHost" size="26">
            <chevron-right-icon />
          </el-icon>
        </div>
      </div>
      <div class="setting-item">
        <div class="item-label">
          入會密碼
          <el-tooltip content="系統隨機生成6位數的密碼">
            <el-icon><help-circle /></el-icon>
          </el-tooltip>
        </div>
        <div class="item-option">
          <el-switch
            v-model="state.isUserPassword"
            @change="onOpenUserPassword"
          />
        </div>
      </div>
      <div class="setting-item">
        <div class="item-label">入會時靜音</div>
        <div class="item-option">
          <el-switch v-model="state.isMuted" />
        </div>
      </div>
      <div class="setting-item">
        <div class="item-label">自動開啟會議錄製</div>
        <div class="item-option">
          <el-switch
            v-model="state.isRecorded"
            @change="() => state.isMetis && (state.isRecorded = true)"
          />
        </div>
      </div>
      <div class="setting-item">
        <div class="item-label">開啟等候室</div>
        <div class="item-option">
          <el-switch v-model="state.isWaitingRoomEnabled" />
        </div>
      </div>
      <div class="setting-item">
        <div class="item-label">Metis發送會議記錄</div>
        <div class="item-option">
          <el-switch
            v-model="state.isMetis"
            @change="(val: boolean) => val && (state.isRecorded = true)"
          />
        </div>
      </div>
    </div>
    <div class="join-btn">
      <el-button
        type="primary"
        size="large"
        :disabled="state.isModel"
        @click="onSubmit"
      >
        確定
      </el-button>
    </div>
  </div>

  <el-dialog
    v-model="state.isPasswordVisible"
    width="300"
    align-center
    :show-close="false"
    @close="state.isUserPassword = state.isSetPassword"
  >
    <template #header>
      入會密碼
      <el-tooltip placement="top-start" content="系統隨機生成6位數的密碼">
        <el-icon><help-circle /></el-icon>
      </el-tooltip>
    </template>
    <div class="dialog-content">
      <el-input :disabled="true" v-model="state.meetingPassword">
        <template #suffix>
          <el-icon @click="onCopyMeeting">
            <copy-icon />
          </el-icon>
        </template>
      </el-input>
      <el-switch v-model="state.isSetPassword" @change="onSwitchPassword" />
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
@use "index";
</style>
