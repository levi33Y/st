<template>
  <Header title="加入會議" :hide-maximizable="true" :is-destroy="true" />
  <div class="container">
    <el-form
      ref="formRef"
      label-position="top"
      :model="state"
      size="large"
      :rules="rules"
    >
      <el-form-item label="會議號" prop="meetingNumber">
        <el-input
          v-model="state.meetingNumber"
          @input="
            (value: string | number) =>
              (state.meetingNumber =
                (value + '')?.replace(/[^0-9]/g, '')?.slice(0, 5) ?? '')
          "
          placeholder="請輸入會議號"
          clearable
        />
      </el-form-item>
      <el-form-item label="您的名稱" prop="userName">
        <el-input
          v-model="state.userName"
          disabled
          placeholder="請輸入您的名稱"
          clearable
        />
      </el-form-item>
      <el-form-item label="會議設置">
        <div class="form-item">
          <el-checkbox
            label="自動連接音頻"
            v-model="state.autoAudio"
            disabled
          />
          <el-checkbox label="入會開啟攝像頭" v-model="state.enableCamera" />
          <el-checkbox label="入會開啟麥克風" v-model="state.microphone" />
        </div>
      </el-form-item>
    </el-form>
    <div class="join-btn">
      <el-button
        type="primary"
        size="large"
        :disabled="disabled"
        @click="onJoinMeeting"
      >
        加入會議
      </el-button>
    </div>
  </div>
  <ConfirmDialog
    :visible="isPassword"
    isNeedPassword
    @onCancel="isPassword = false"
    @onConfirm="confirmPassword"
  />
</template>

<script setup lang="ts">
import Header from "../../components/header/index.vue";
import { useAction } from "./hooks";
import ConfirmDialog from "../../components/confirm-dialog/index.vue";
const {
  formRef,
  rules,
  state,
  disabled,
  onJoinMeeting,
  isPassword,
  confirmPassword,
} = useAction();
</script>

<style scoped lang="scss">
@use "./index";
</style>
