<template>
  <div class="member-user-item">
    <Avatar :size="36" :name="stream.name" />
    <div class="user-info">
      <p>{{ stream.participant.name }}</p>
    </div>
    <div :class="['mic-mute-status', stream.isMuted && 'disabled']">
      <Microphone :size="16" :frequency="frequency" />
    </div>
    <div class="remove-user" v-if="appStore.isModerator">
      <el-icon @click="kicOut"><CircleCloseFilled /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import Avatar from "../../../../../../components/avatar/index.vue";
import Microphone from "../../../../../../components/microphone/index.vue";
import { useGetFrequencyByParticipantStream } from "../../../../../../hooks/useGetFrequencyByParticipantStream";
import { ParticipantStream } from "../../../../../../utils/livekit/ParticipantStream";
import { CircleCloseFilled } from "@element-plus/icons-vue";
import { kickOutUserApi, verifyMasterApi } from "../../../../../../services";
import { useAppStore } from "../../../../../../stores/useAppStore";
import { ElMessage, ElMessageBox } from "element-plus";
import { toRefs } from "vue";

interface Props {
  stream: ParticipantStream;
  meetingId: string;
  sendKicOutUser: (kicUserId: number | string) => void;
}
const appStore = useAppStore();

const props = defineProps<Props>();

const { stream, meetingId } = toRefs(props);

const { frequency } = useGetFrequencyByParticipantStream(stream.value);
const kicOut = async () => {
  ElMessageBox.confirm("是否確認執行操作?", {
    confirmButtonText: "是",
    cancelButtonText: "否",
    showClose: false,
    center: true,
    // customClass: "el-message-box",
  }).then(async () => {
    const { data, code } = await verifyMasterApi(
      meetingId.value,
      appStore.userInfo.id,
    );
    const kicOutUserId = Number(stream.value.id);

    if (code === 200 && data?.isMeetingMaster) {
      if (typeof kicOutUserId === "number" && !isNaN(kicOutUserId)) {
        const { code, msg } = await kickOutUserApi(
          meetingId.value,
          kicOutUserId,
        );
        if (code === 200) {
          props.sendKicOutUser(stream.value.id);
          ElMessage({
            offset: 50,
            message: "操作成功",
            type: "success",
          });
        } else {
          ElMessage({
            offset: 50,
            message: msg,
            type: "error",
          });
        }
      } else {
        props.sendKicOutUser(stream.value.id);
      }
    }
  });
};
</script>

<style scoped lang="scss">
@use "./index";
</style>
