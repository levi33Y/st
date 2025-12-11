import { defineStore } from "pinia";

export const useDrawingStore = defineStore("drawingStore", {
  state: () => ({
    lineSize: 9,
    lineColor: "#e62222",
  }),
  actions: {},
});
