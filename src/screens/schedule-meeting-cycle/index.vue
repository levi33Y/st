<script setup lang="ts">
import DialogWindow from "@components/dialog-window/index.vue";
import CloseIcon from "@icon/close/index.vue";
import { CustomFrequencyTypeEnum } from "../../services/apis/meeting/types";
import MonthlyOption from "./components/monthly-option/index.vue";
import WeeklyOption from "./components/weekly-option/index.vue";
import { useAction } from "./hooks";
import { FrequencyConst } from "./props";

const {
  dialogWindowRef,
  formModelConst,
  formData,
  formState,
  formRef,
  rules,
  onClose,
  onConfirm,
} = useAction();
</script>

<template>
  <dialog-window :formData="formData" ref="dialogWindowRef">
    <template #header>
      <span>自定義週期</span>
      <el-icon @click="onClose"><close-icon /></el-icon>
    </template>
    <div class="container">
      <el-form
        ref="formRef"
        label-width="auto"
        label-position="right"
        size="large"
        :model="formModelConst"
        :rules="rules"
      >
        <el-form-item label="頻率" prop="frequency" required>
          <el-select
            class="m-2"
            placeholder="選擇時間"
            style="width: 100%"
            v-model="formState.frequency"
          >
            <el-option
              v-for="item in FrequencyConst"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="每" prop="cycleTimes" required>
          <div class="embedded-item">
            <el-select
              class="form-item"
              placeholder="選擇時間"
              v-model="formState.cycleTimes"
            >
              <el-option
                v-for="item in Array.from(
                  { length: 12 },
                  (_, index) => index + 1,
                )"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>

            {{
              formState.frequency === CustomFrequencyTypeEnum.Daily
                ? "天"
                : formState.frequency === CustomFrequencyTypeEnum.Weekly
                  ? "周"
                  : formState.frequency === CustomFrequencyTypeEnum.Monthly
                    ? "月"
                    : ""
            }}
          </div>
        </el-form-item>
        <el-form-item
          v-if="formState.frequency !== CustomFrequencyTypeEnum.Daily"
          label="頻率"
          prop="cycleFrequency"
        >
          <weekly-option
            v-if="formState.frequency === CustomFrequencyTypeEnum.Weekly"
            v-model="formState.weeklyOption"
          />

          <monthly-option
            v-if="formState.frequency === CustomFrequencyTypeEnum.Monthly"
            v-model="formState.monthlyOption"
          />
        </el-form-item>
        <el-form-item label="結束於" prop="endDate">
          <el-date-picker
            v-model="formState.endDate"
            popper-class="custom-date-picker"
            :disabled-date="
              (time: Date) => time.getTime() < Date.now() - 8.64e7
            "
            style="width: 100%"
            type="date"
            placeholder="選擇日期"
            format="YYYY年MM月DD日"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button size="default" type="info" @click="onClose">取消</el-button>
      <el-button size="default" type="primary" @click="onConfirm">
        確認
      </el-button>
    </template>
  </dialog-window>
</template>

<style scoped lang="scss">
@use "index";
</style>
