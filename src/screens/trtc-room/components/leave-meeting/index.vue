<template>
  <el-button v-if="isModerator" type="danger" plain @click="onOpen">
    結束會議
  </el-button>
  <el-button v-else type="danger" plain @click="onOpen">離開會議</el-button>

  <el-dialog
    class="before-leave-meeting-dialog"
    v-model="state.beforeVisible"
    :append-to-body="true"
    :show-close="false"
    :center="true"
    :align-center="true"
    :width="192"
  >
    <el-button type="danger" @click="onEndMeeting">結束會議</el-button>
    <el-button type="danger" plain @click="onLeaveMeeting">離開會議</el-button>
    <el-button @click="onClose">取消</el-button>
  </el-dialog>

  <el-dialog
    class="leave-meeting-dialog"
    v-model="state.leaveVisible"
    :append-to-body="true"
    :show-close="false"
    :center="true"
    :align-center="true"
    :width="428"
  >
    <template #header>
      <div class="header">離開會議</div>
    </template>
    <div class="content">離開會議後，您仍可使用此會議號再次加入會議。</div>
    <template #footer>
      <el-button class="leave-btn" @click="onClose">取消</el-button>
      <el-button class="leave-btn" type="primary" @click="onLeaveMeeting">
        離開會議
      </el-button>
    </template>
  </el-dialog>

  <el-dialog
    class="end-meeting-dialog"
    v-model="state.endVisible"
    :append-to-body="true"
    :show-close="false"
    :center="true"
    :align-center="true"
    :width="428"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="content">會議已結束</div>
    <template #footer>
      <el-button class="end-btn" type="primary" @click="onEnd">
        {{ `知道了(${state.countdown})` }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { roomService } from "@/utils/trtc/roomService";
import { computed, reactive } from "vue";
import { useNavigation } from "../../../../hooks/useNavigation";

interface Emits {
  (event: "onLeaveMeeting"): void;
  (event: "onEndMeeting"): void;
}

interface Exposes {
  open: () => void;
  close: () => void;
  openEnd: () => void;
  onRemove: () => void;
}

const navigation = useNavigation();

const emits = defineEmits<Emits>();

const state = reactive({
  beforeVisible: false,
  leaveVisible: false,
  endVisible: false,
  removeVisible: false,
  countdown: 0,
});

const isModerator = computed(() => roomService.roomStore.isModerator);

const onOpen = () => {
  if (state.endVisible) return;
  if (isModerator.value) {
    state.beforeVisible = true;
  } else {
    state.leaveVisible = true;
  }
};

const onClose = () => {
  if (isModerator.value) {
    state.beforeVisible = false;
  } else {
    state.leaveVisible = false;
  }
};

const onLeaveMeeting = async () => {
  onClose();

  emits("onLeaveMeeting");

  navigation.destroy("/invite");
};

const onEndMeeting = async () => {
  onClose();

  emits("onEndMeeting");

  navigation.destroy("/invite");
};

const onEnd = () => {
  state.endVisible = false;
  emits("onLeaveMeeting");
};

const endLoop = () => {
  setTimeout(() => {
    const countdown = state.countdown - 1;
    if (countdown === 0) {
      onEnd();
    } else {
      state.countdown = countdown;
      endLoop();
    }
  }, 1000);
};

const onOpenEnd = () => {
  state.endVisible = true;
  state.countdown = 5;
  endLoop();
};

const onRemove = () => {
  emits("onLeaveMeeting");
};

defineExpose<Exposes>({
  open: onOpen,
  close: onClose,
  openEnd: onOpenEnd,
  onRemove: onRemove,
});
</script>

<style lang="scss">
@use "./index";
</style>
