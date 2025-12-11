<script setup lang="ts">
import { StoreEventEnum, useNavigation } from "@/hooks/useNavigation";
import {
  MeetingDropdownEnum,
  MeetingDropdownType,
} from "@/screens/sharing-dropdown-menu/props";
import { onMounted, ref } from "vue";
import Function from "./components/function/index.vue";
import invite from "./components/invite/index.vue";
import security from "./components/security/index.vue";

const DropdownPage = "/sharing-dropdown-menu";

const navigation = useNavigation();

const dropdownType = ref();

onMounted(() => {
  navigation.on(
    StoreEventEnum.OpenRoomDropdownMenu,
    (type: MeetingDropdownType) => {
      switch (type) {
        case MeetingDropdownEnum.Function: {
          dropdownType.value = type;

          window.windowControl.setSize(DropdownPage, {
            width: 180,
            height: 40,
          });
          break;
        }
        case MeetingDropdownEnum.Invite: {
          dropdownType.value = type;

          window.windowControl.setSize(DropdownPage, {
            width: 180,
            height: 80,
          });

          break;
        }
        case MeetingDropdownEnum.Security: {
          dropdownType.value = type;

          window.windowControl.setSize(DropdownPage, {
            width: 180,
            height: 80,
          });

          break;
        }
        default: {
          break;
        }
      }
    },
  );
});
</script>

<template>
  <function v-show="dropdownType === MeetingDropdownEnum.Function" />
  <invite v-show="dropdownType === MeetingDropdownEnum.Invite" />
  <security v-show="dropdownType === MeetingDropdownEnum.Security" />
</template>

<style scoped lang="scss"></style>
