<template>
  <el-dialog
    class="custom-dialog"
    v-model="props.visible"
    :width="330"
    :append-to-body="true"
    :center="true"
    :show-close="true"
    :align-center="true"
  >
    <div v-if="props.isJoinRule" class="confirm-container">
      <div class="title">會議時間結束24小時內可以重新入會。</div>
      <div class="button">
        <el-button type="primary" @click="onCancel">我知道了</el-button>
      </div>
    </div>
    <div v-if="props.isDelMeeting" class="confirm-container">
      <div class="title">是否確認刪除數據？</div>
      <div class="button">
        <el-button type="primary" plain @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onConfirm">删除</el-button>
      </div>
    </div>
    <div v-if="props.isNeedPassword" class="confirm-container">
      <div class="title">
        <span style="width: 54px">密碼：</span
        ><el-input v-model="passWord" placeholder="請輸入入會密碼"></el-input>
      </div>
      <div class="button">
        <el-button type="primary" plain @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onConfirm">確定</el-button>
      </div>
    </div>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, reactive } from "vue";
interface Props {
  visible: boolean;
  isJoinRule?: boolean;
  isDelMeeting?: boolean;
  isNeedPassword?: boolean;
}
interface Emits {
  (event: "onCancel"): void;
  (event: "onConfirm", data: string): void;
}
const props = defineProps<Props>();
const emits = defineEmits<Emits>();
const onCancel = () => emits("onCancel");
const onConfirm = () => emits("onConfirm", passWord.value);
const passWord = ref("");
</script>
<style lang="scss" scoped>
@use "./index";
</style>
