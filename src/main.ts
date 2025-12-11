import { CheckedDirective } from "@/directives";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "normalize.css";
import { createApp } from "vue";
import App from "./App.vue";
import "./directives/index.scss";
import router from "./router";
import pinia from "./stores";
import { useAppStore } from "./stores/useAppStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import "./styles/element-theme.scss";
import "./styles/index.scss";

createApp(App)
  .use(pinia)
  .use(router)
  .use(ElementPlus)
  .directive("checked", CheckedDirective)
  .mount("#app")
  .$nextTick(async () => {
    useAppStore().init();
    useSettingsStore().init();
  });
