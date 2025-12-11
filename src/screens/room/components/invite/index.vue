<template>
  <ActionBtn title="邀請" icon="icon-invite" @click="openInvite">
    <el-icon :size="32"><invite-icon /></el-icon>
  </ActionBtn>
</template>

<script setup lang="ts">
import InviteIcon from "@icon/invite/index.vue";
import { useNavigation } from "../../../../hooks/useNavigation";
import ActionBtn from "../action-btn/index.vue";

interface Props {
  meetingId: string;
}
const props = defineProps<Props>();
const navigation = useNavigation();
const openInvite = () => {
  navigation.navigate("/invite", { meetingId: props.meetingId });
};
</script>

<style scoped lang="scss">
@use "./index";
</style>
