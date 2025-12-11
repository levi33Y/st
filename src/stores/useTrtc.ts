import { defineStore } from "pinia";

export const useTrtcKeyStore = defineStore("trtcKey", {
  state: (): {
    appId: number;
    sdkSecretKey: string;
  } => ({
    appId: 0,
    sdkSecretKey: "",
  }),
  actions: {},
  persist: true,
});
