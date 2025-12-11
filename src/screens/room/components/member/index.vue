<template>
  <ActionBtn
    :title="`成員(${streamList.length ?? 0})`"
    icon="icon-avatar"
    @click="visible = true"
  />

  <el-dialog
    class="custom-dialog"
    v-model="visible"
    :width="330"
    :append-to-body="true"
    :center="true"
    :show-close="true"
    :align-center="true"
  >
    <Header
      :title="`成員(${streamList.length ?? 0})`"
      :is-inner="true"
      borderBottom
      :close="() => (visible = false)"
    />
    <div class="member-body">
      <!-- <div class="search-box">
        <el-input placeholder="搜索成员" clearable v-model="searchName">
          <template #prepend>
            <el-button :icon="Search" />
          </template>
        </el-input>
      </div> -->
      <el-scrollbar>
        <template v-if="searchStreamList.length > 0">
          <div class="user-list">
            <User
              v-for="stream in searchStreamList"
              :key="stream.id"
              :stream="stream"
              :meetingId="meetingId"
              :send-kic-out-user="sendKicOutUser"
            />
          </div>
        </template>
        <template v-else>
          <div class="not-found">
            <img
              class="not-found-image"
              src="../../../../assets/images/not-found.png"
            />
            <p class="not-found-tips">未找到相關成員</p>
          </div>
        </template>
      </el-scrollbar>
    </div>
    <div class="member-footer">
      <template v-if="searchStreamList.length > 0 && appStore.isModerator">
        <el-button type="primary" plain :loading="loading" @click="onClick">
          全體靜音
        </el-button>
      </template>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import ActionBtn from "../action-btn/index.vue";
import Header from "../../../../components/header/index.vue";
import User from "./components/user/index.vue";
import { ref } from "vue";
import { Search } from "@element-plus/icons-vue";
import { toRefs } from "vue";
import { getMediaDeviceAccessAndStatus } from "../../../../utils/media";
import { computed } from "vue";
import { ParticipantStream } from "../../../../utils/livekit/ParticipantStream";
import { useAppStore } from "../../../../stores/useAppStore";

interface Props {
  streamList: ParticipantStream[];
  isMuted: boolean;
  update: (status: boolean) => Promise<void>;
  meetingId: string;
  sendKicOutUser: (kicUserId: number | string) => void;
  sendAllSilent: () => void;
}

const props = defineProps<Props>();

const appStore = useAppStore();

const { isMuted, streamList, meetingId } = toRefs(props);

const visible = ref(false);

const loading = ref(false);

const searchName = ref("");

const searchStreamList = computed(() => {
  const searchLower = searchName.value?.toLocaleLowerCase();

  return (props?.streamList ?? [])
    .filter((stream) => {
      const participantName = stream.participant.name?.toLocaleLowerCase();
      return participantName?.includes(searchLower);
    })
    .sort((a, b) => {
      const aName = a.participant.name?.toLocaleLowerCase() || "";
      const bName = b.participant.name?.toLocaleLowerCase() || "";
      return aName.localeCompare(bName);
    });
});

const onClick = () => {
  if (appStore.isModerator) {
    props?.update(true);
    props.sendAllSilent();
  }
};
</script>

<style scoped lang="scss">
@use "./index";
</style>
