<script setup lang="ts">
import { debounce, isNil } from "lodash";
import moment from "moment-timezone";
import Avatar from "../../../../components/avatar/index.vue";
import { ITranslateStateRecordDetailProps } from "../../props";

const emits = defineEmits<{
  (event: "jump", targetTime: number): void;
}>();

const onJump = debounce((e: any, time = "") => {
  e.target.classList.add("flash");

  setTimeout(() => {
    e.target.classList.remove("flash");
  }, 1000);

  emits("jump", moment.duration(time).asSeconds());
}, 300);

defineProps<{
  recordDetail: ITranslateStateRecordDetailProps | null;
  visible: boolean;
}>();
</script>

<template>
  <div class="intelligent-result" v-show="visible">
    <div
      class="result-list"
      v-for="(item, index) in recordDetail?.meetingRecordDetails ?? []"
    >
      <div class="result-text" :key="index">
        <Avatar class="result-avatar" :size="39" :name="item?.username ?? ''" />
        <div class="result-main">
          <span class="text-primary">
            {{ item.username }}
            <span class="text-secondary">
              {{ item?.timePoint }}
            </span>
          </span>
          <div class="text-secondary">
            <div>
              <span
                v-if="!isNil(item.originalTranslationContent)"
                style="color: var(--color-primary)"
              >
                原文：
              </span>
              <span
                class="text-origin"
                @click="(e) => onJump(e, item!.timePoint)"
              >
                {{ item.originalContent }}
              </span>
            </div>
            <div v-if="!isNil(item.originalTranslationContent)">
              <span style="color: var(--color-warning)">譯文：</span>
              {{ item.originalTranslationContent }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "./index";
</style>
