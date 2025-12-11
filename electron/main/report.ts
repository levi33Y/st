import { app, crashReporter } from "electron";

const appName = app.name;

const isTestEnv = appName === "SugarTalkTest";

// 配置崩溃报告器
crashReporter.start({
  productName: appName,
  companyName: "SugarTalk",
  submitURL: "",
  uploadToServer: false,
  compress: true,
  extra: {
    environment: isTestEnv ? "test" : "production",
    appName: appName,
    timestamp: new Date().toISOString(),
  },
});
