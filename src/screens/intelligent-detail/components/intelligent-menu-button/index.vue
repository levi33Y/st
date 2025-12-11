<script setup lang="ts">
import { ArrowRightBold } from "@element-plus/icons-vue";
import { ElTooltip, TooltipInstance } from "element-plus";
import _ from "lodash";
import { ref } from "vue";
import { IMenuButtonDataProps } from "../../props";

const props = defineProps<{
  label?: string;
  data?: IMenuButtonDataProps[];
  trigger?: "hover" | "click";
}>();

const menuButtonTooltipRef = ref<TooltipInstance>();

const emits = defineEmits(["click"]);

const onHideTooltip = () => {
  menuButtonTooltipRef?.value && menuButtonTooltipRef.value?.hide();
};

defineExpose({
  hide: onHideTooltip,
});
</script>

<template>
  <el-tooltip
    ref="menuButtonTooltipRef"
    effect="light"
    popper-class="menu-button"
    :trigger="trigger"
    :hide-after="0"
  >
    <slot>
      <el-button plain>
        {{ props.label }}
      </el-button>
    </slot>
    <template #content>
      <div class="dropdown-container">
        <div
          v-for="(parent, index) in props.data"
          :key="index"
          class="menu-option-parent"
        >
          <div
            class="menu-option-item"
            @click="emits('click', [parent?.value])"
          >
            {{ parent.label }}
            <el-icon v-if="!_.isNil(parent.children)">
              <ArrowRightBold />
            </el-icon>
          </div>
          <div v-if="!_.isNil(parent.children)" class="child-mask">
            <div class="menu-option-child outer-shadow">
              <div
                v-for="child in parent.children"
                class="menu-option-item"
                @click="emits('click', [parent?.value, child?.value])"
              >
                {{ child.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </el-tooltip>
</template>

<style scoped lang="scss">
@use "./index";
</style>

<style lang="scss">
.menu-button.el-popper {
  padding: 0;
  border: 1px solid #e9ebf4;
  box-shadow: 0px 0px 10px 3px rgba(0, 0, 0, 0.08);

  .el-popper__arrow {
    &:before {
      display: none;
    }
  }
}
</style>
