import { useThrottleFn, useWindowFocus } from "@vueuse/core";
import { onMounted, onUnmounted, ref } from "vue";

export const useMouse = () => {
  const stoped = ref(false);

  const _timer = ref<NodeJS.Timeout>();

  const focused = useWindowFocus();

  const mousemove = useThrottleFn(() => {
    stoped.value = false;
    clearTimeout(_timer.value);
    _timer.value = setTimeout(() => {
      stoped.value = true;
    }, 3000);
  }, 100);

  onMounted(() => {
    document.body.addEventListener("mousemove", mousemove);
  });

  onUnmounted(() => {
    document.body.removeEventListener("mousemove", mousemove);
    clearTimeout(_timer.value); // 清理定时器
  });

  return {
    stoped,
    focused,
  };
};
