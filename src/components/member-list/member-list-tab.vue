<script setup lang="ts">
import { computed } from "vue";
import { MeetingParticipant, MemberListTabEnum } from "./props";

const props = defineProps<{
  participants: MeetingParticipant[];
}>();

const activeTabModel = defineModel<MemberListTabEnum>({
  default: MemberListTabEnum.Meeting,
});

const onSwitchTab = (tab: MemberListTabEnum) => {
  activeTabModel.value = tab;
};

const memberNumber = computed(() => {
  return props.participants?.length ? `· ${props.participants.length}` : "";
});
</script>

<template>
  <div class="member-list-tab">
    <div
      :class="[
        'tab-option',
        { 'tab-active': activeTabModel === MemberListTabEnum.Meeting },
      ]"
      @click="onSwitchTab(MemberListTabEnum.Meeting)"
    >
      會議中{{ memberNumber }}
    </div>
    <div
      :class="[
        'tab-option',
        { 'tab-active': activeTabModel === MemberListTabEnum.Wait },
      ]"
      @click="onSwitchTab(MemberListTabEnum.Wait)"
    >
      等候室{{ memberNumber }}
    </div>
    <div
      :class="[
        'tab-option',
        { 'tab-active': activeTabModel === MemberListTabEnum.Ending },
      ]"
      @click="onSwitchTab(MemberListTabEnum.Ending)"
    >
      未入會{{ memberNumber }}
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "index";
</style>
