import genTestUserSig from "@/utils/trtc/config/gen-test-user-sig";
import { defineStore } from "pinia";

interface IBasicStoreStateProps {
  SDKAppID: number;
  SDKSecretKey: string;
  userSig: "";
  userSid: "";
}

export const useBasicStore = defineStore("basicStore", {
  state: (): IBasicStoreStateProps => ({
    SDKAppID: 0,
    SDKSecretKey: "",
    userSig: "",
    userSid: "",
  }),
  actions: {
    setSDKApp(SDKAppID: number, SDKSecretKey: string) {
      this.SDKAppID = SDKAppID;

      this.SDKSecretKey = SDKSecretKey;
    },

    generateSig(useSid: string) {
      if (!this.SDKAppID || !this.SDKSecretKey) {
        console.log("SDK 为空");

        return;
      }

      const user = genTestUserSig(
        useSid,
        Number(this.SDKAppID),
        this.SDKSecretKey,
      );

      return {
        userID: useSid,
        userSig: user.userSig,
      };
    },
  },
  getters: {
    sdk(state) {
      return {
        SDKAppID: Number(state.SDKAppID),
        SDKSecretKey: state.SDKSecretKey,
      };
    },
  },
  persist: true,
});
