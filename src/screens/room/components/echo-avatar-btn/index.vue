<template>
  <ActionBtn
    title=""
    icon=""
    :moderator-disabled="disabled"
    @click="onClick"
    v-loading="loading"
  >
    <div class="echo-avatar-icon">
      <img
        src="../../../../assets/images/icon-ea.png"
        :style="`height:${32}px;`"
      />
    </div>
    <template #title>
      <div class="echo-avatar-logo">
        <img
          src="../../../../assets/images/echo-avatar.png"
          :style="`height:${7.61}px`"
        />
      </div>
    </template>
  </ActionBtn>
</template>

<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import { ElMessage } from "element-plus";
import { computed, ref } from "vue";
import { EchoAvatarType } from "../../../../entity/enum";
import { updateSwitchEaAPI } from "../../../../services";
import { useAppStore } from "../../../../stores/useAppStore";
import ActionBtn from "../action-btn/index.vue";

interface Emits {
  (event: "click"): void;
}
interface Props {
  sendEchoAvatar: (type: EchoAvatarType, status: boolean) => void;
  meetingId: string;
}
const props = defineProps<Props>();

const appStore = useAppStore();

const disabled = computed(() => !appStore.isModerator);

const loading = ref(false);

const emits = defineEmits<Emits>();

const handleUpdateEA = async () => {
  try {
    loading.value = true;

    const { code, msg } = await updateSwitchEaAPI(
      props.meetingId,
      !appStore.isOpenEA,
    );
    if (code === 200) {
      appStore.isOpenEA = !appStore.isOpenEA;
      emits("click");
      props.sendEchoAvatar(EchoAvatarType.SwitchEA, appStore.isOpenEA);
    } else {
      ElMessage({
        message: msg,
        type: "error",
      });
    }
  } finally {
    loading.value = false;
  }
};

const onClick = useDebounceFn(async () => {
  if (appStore.isModerator) {
    await handleUpdateEA();
  }
}, 200);

defineExpose({
  updateState: handleUpdateEA,
});
</script>

<style scoped lang="scss">
@use "./index";
</style>
