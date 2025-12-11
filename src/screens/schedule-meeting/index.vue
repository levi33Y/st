<template>
  <div :class="[state.isModel ? 'modal-style' : '']" />
  <Header
    :title="isEdit ? '修改會議' : '預定會議'"
    :hide-maximizable="true"
    :is-destroy="true"
    :is-inner="state.isModel"
  />
  <div class="container">
    <el-form
      ref="formRef"
      label-width="auto"
      label-position="right"
      :model="state"
      size="large"
      :rules="rules"
    >
      <el-form-item label="主題:" prop="meetingTitle">
        <el-input
          v-model="state.meetingTitle"
          placeholder="請輸入會議主題"
          clearable
          :maxlength="40"
          :minlength="5"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="參會人:" prop="meetingMember">
        <el-autocomplete
          :disabled="state.isModel"
          v-model="participantState.meetingMemberSearch"
          placeholder="輸入名稱搜索"
          :fetch-suggestions="handleMemberSuggestions"
          @select="onSelectMemberSelect"
        >
          <template #default="{ item }">
            <div class="meeting-option-item">
              <Avatar :size="36" :name="item.name" :src="item?.avatarUrl" />
              <component :is="item.message" />
            </div>
          </template>
          <template #suffix>
            <el-icon @click.stop="onOpenParticipantDialog">
              <user-add />
            </el-icon>
          </template>
        </el-autocomplete>
        <el-scrollbar :max-height="scrollHeight">
          <div class="meeting-select-list">
            <div
              class="meeting-select-item"
              v-for="(data, index) in state.meetingMemberList"
              :key="index"
              v-show="participantState.isShowMeetingAllMember || index < 16"
            >
              <div>
                <Avatar :size="36" :name="data?.name" :src="data?.avatarUrl" />
              </div>
              <span>{{ data?.name }}</span>
            </div>
            <div v-if="state.meetingMemberList.length > 16">
              <div
                class="chevron-option-item"
                @click="participantState.isShowMeetingAllMember = false"
                v-if="participantState.isShowMeetingAllMember"
              >
                收起
                <el-icon><chevron-up-double /></el-icon>
              </div>
              <div
                class="chevron-option-item"
                @click="participantState.isShowMeetingAllMember = true"
                v-else
              >
                共{{ state.meetingMemberList.length }}人
                <el-icon><chevron-down-double /></el-icon>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </el-form-item>
      <el-form-item label="開始:" prop="meetingStartDate">
        <el-date-picker
          popper-classs="custom-date-picker"
          style="width: 58%"
          v-model="state.meetingStartDate"
          :disabled-date="disabledDate"
          type="date"
          placeholder="選擇日期"
        />
        <el-time-select
          :style="{ width: '40%', marginLeft: '2%' }"
          v-model="state.meetingStartTime"
          start="00:00"
          step="00:15"
          end="23:45"
          placeholder="時間"
        />
      </el-form-item>
      <el-form-item label="時長:" prop="meetingEndTime">
        <el-select
          v-model="state.meetingEndTime"
          class="m-2"
          placeholder="選擇時間"
          style="width: 100%"
        >
          <el-option
            v-for="item in timeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="時區:" prop="meetingTimeZone">
        <el-select
          v-model="state.meetingTimeZone"
          class="m-2"
          placeholder="選擇時區"
          style="width: 100%"
        >
          <el-option
            v-for="item in timeZoneOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="週期:" prop="meetingCycle">
        <el-select
          v-model="state.meetingCycle"
          class="m-2"
          placeholder="Select"
          style="width: 100%"
          @change="onSelectChange"
        >
          <el-option
            v-for="item in cycleOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="state.meetingCycle !== MeetingRepeatType.None"
        label="結束於:"
      >
        <el-date-picker
          popper-classs="custom-date-picker"
          style="width: 100%"
          v-model="cycleState.meetingCycleEndingTime"
          :disabled-date="disabledDate"
          type="date"
          placeholder="請選擇日期"
          format="YYYY年MM月DD日"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="設置">
        <el-button plain type="primary" @click="onOpenSetting">
          會議設置
        </el-button>
      </el-form-item>
    </el-form>
    <div class="join-btn">
      <el-button
        type="primary"
        size="large"
        @click="onScheduleMeeting(formRef)"
        :disabled="state.isModel"
      >
        預定
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Avatar from "@components/avatar/index.vue";
import ChevronDownDouble from "@icon/chevron-down-double/index.vue";
import ChevronUpDouble from "@icon/chevron-up-double/index.vue";
import UserAdd from "@icon/user-add/index.vue";
import Header from "../../components/header/index.vue";
import { MeetingRepeatType } from "../../entity/enum";
import { useAction } from "./hooks";

const {
  formRef,
  participantState,
  isEdit,
  rules,
  state,
  cycleState,
  timeOptions,
  timeZoneOptions,
  cycleOptions,
  disabledDate,
  scrollHeight,
  onScheduleMeeting,
  handleMemberSuggestions,
  onOpenParticipantDialog,
  onOpenSetting,
  onSelectMemberSelect,
  onSelectChange,
} = useAction();
</script>

<style scoped lang="scss">
@use "./index";
</style>
