<script setup lang="ts">
import Header from "@components/header/index.vue";
import MemberList from "@components/member-list/index.vue";
import { useAction } from "./hook";

const {
  appStore,
  participantList,
  permissionList,
  handleMemberListDataReceived,
} = useAction();
</script>

<template>
  <Header v-show="!appStore.isFullscreen" title="管理成員" />

  <div class="container">
    <div class="member-list-body">
      <member-list
        :stream-list="participantList"
        :meeting-permission="permissionList"
        @data-event="handleMemberListDataReceived"
      ></member-list>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./index.scss";
</style>
