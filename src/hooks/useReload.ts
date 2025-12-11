import { ElLoading } from "element-plus";
import { ref } from "vue";
export function useReloading() {
  const isLoading = ref(false);

  const reloadToggle = () => {
    isLoading.value = true;

    const loadingInstance = ElLoading.service({
      fullscreen: true,
    });

    setTimeout(() => {
      loadingInstance.close();

      isLoading.value = false;
    }, 500);
  };

  return {
    isLoading,
    reloadToggle: reloadToggle,
  };
}
