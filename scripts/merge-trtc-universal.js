#!/usr/bin/env node
const { execSync } = require("child_process");

try {
  execSync(
    `
    lipo -create \
      node_modules/trtc-electron-sdk/build/Release/arm64/trtc_electron_sdk.node \
      node_modules/trtc-electron-sdk/build/Release/x64/trtc_electron_sdk.node \
      -output node_modules/trtc-electron-sdk/build/Release/trtc_electron_sdk.node
  `,
    { stdio: "inherit" },
  );
  console.log("✅ Universal binary 生成成功！");
} catch (e) {
  console.error(
    "❌ 合并失败，请检查：\n1. 文件路径是否正确\n2. 是否安装 Xcode 命令行工具（运行 xcode-select --install）",
  );
  process.exit(1);
}
