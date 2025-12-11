<script setup lang="ts">
import { IManagementMemberProps } from "@/screens/trtc-room/components/member-list/props";
import { inviteCreate } from "@/services";
import {
  InvitationStatusEnum,
  InvitationStatusTextConst,
} from "@/services/apis/meeting/types";
import { IMeetingInfoProps } from "@/utils/trtc/store/room";
import { useDebounceFn } from "@vueuse/core";
import { ElMessage } from "element-plus";
import { isNil } from "lodash";
import { ref, watch } from "vue";

const props = defineProps<{
  meetingInfo: IMeetingInfoProps;
  participant: IManagementMemberProps;
}>();

const emits = defineEmits<{
  (event: "onCall", data: IManagementMemberProps): void;
}>();

const statusText = ref<string | null>(null);

watch(
  () => props.participant?.invitationStatus,
  (sub, pre) => {
    if (
      (isNil(pre) && sub !== InvitationStatusEnum.InvitationPending) ||
      isNil(sub)
    ) {
      statusText.value = null;
    } else if (pre === InvitationStatusEnum.InvitationPending) {
      const timeLimit = sub === InvitationStatusEnum.Accepted ? 60000 : 3000;

      statusText.value = InvitationStatusTextConst[sub];

      setTimeout(() => {
        statusText.value = null;
      }, timeLimit);
    } else if (sub === InvitationStatusEnum.InvitationPending) {
      statusText.value = InvitationStatusTextConst[sub];
    }
  },
  {
    immediate: true,
  },
);

const onCall = useDebounceFn(async () => {
  emits("onCall", props.participant);

  statusText.value =
    InvitationStatusTextConst[InvitationStatusEnum.InvitationPending];

  const res = await inviteCreate({
    meetingId: props.meetingInfo.meetingId,
    meetingSubId: props.meetingInfo.meetingSubId,
    names: [props.participant.name],
  });

  if (res.code !== 200) {
    ElMessage.error("呼叫失败");

    statusText.value = null;
  }
}, 300);
</script>

<template>
  <div class="member-list-wait">
    <span v-if="!isNil(statusText)">
      {{ statusText }}
    </span>
    <el-button v-else size="small" type="primary" @click="onCall()">
      呼叫
    </el-button>
  </div>
</template>

<style scoped lang="scss"></style>
