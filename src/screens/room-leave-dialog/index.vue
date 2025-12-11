<script setup lang="ts">
import { StoreEventEnum } from "@/entity/enum";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppStore } from "@/stores/useAppStore";
import { useMeetingStore } from "@/stores/useMeetingStore";
import { onMounted, ref } from "vue";

const isModerator = ref(false);

const meetingStore = useMeetingStore();

const appStore = useAppStore();

const navigate = useNavigation();

const onDispatch = (hash: string) => {
  window.store.dispatch(StoreEventEnum.LeaveMeeting, hash);

  navigate.close();
};

onMounted(() => {
  isModerator.value = meetingStore.isModerator(appStore.userInfo.id + "");

  window.store.subscribe(async (key, value) => {
    switch (key) {
      case StoreEventEnum.UpdateMeetingParticipants:
        isModerator.value = meetingStore.isModerator(appStore.userInfo.id + "");
        break;
      default:
        break;
    }
  });
});
</script>

<template>
  <div class="container">
    <el-button
      class="leave-btn"
      v-if="isModerator"
      type="danger"
      @click="
        () => {
          onDispatch('end');
        }
      "
    >
      結束會議
    </el-button>
    <el-button
      class="leave-btn"
      type="danger"
      plain
      @click="
        () => {
          onDispatch('leave');
        }
      "
    >
      離開會議
    </el-button>
    <el-button
      class="leave-btn"
      @click="
        () => {
          navigate.close();
        }
      "
    >
      取消
    </el-button>
  </div>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  padding: var(--spacing-medium);
  display: flex;
  flex-direction: column;
  row-gap: var(--spacing-medium);
  justify-content: center;
  align-items: center;

  .leave-btn {
    width: 100%;
    margin: 0;
    padding: 0;
  }
}
</style>
