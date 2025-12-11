import { nextTick, ref } from "vue";

export const useScroll = () => {
  const scrollbar = ref<{
    handleScroll: () => void;
    scrollTo: (options: ScrollToOptions | number, yCoord?: number) => void;
    setScrollTop: (scrollTop: number) => void;
    setScrollLeft: (scrollLeft: number) => void;
    update: () => void;
    wrapRef: HTMLDivElement;
  }>();

  const setScrollTop = (scrollTop = 0) =>
    scrollbar.value!.setScrollTop(scrollTop);

  const scrollToBottom = () =>
    nextTick(() => setScrollTop(scrollbar.value!.wrapRef.scrollHeight));

  return {
    scrollbar,
    scrollToBottom,
  };
};
