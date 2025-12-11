const path = require("path");
const fse = require("fs-extra");

const currentDir = __dirname;
const projectRoot = path.resolve(currentDir, "..");

const sourceDir = path.resolve(projectRoot, "../../trtc-electron-sdk");

const targetDir = path.resolve(projectRoot, "node_modules/trtc-electron-sdk");

console.log(`🔄 替换整个 trtc-electron-sdk 文件夹...`);
console.log(`FROM: ${sourceDir}`);
console.log(`TO:   ${targetDir}`);

try {
  fse.removeSync(targetDir);

  fse.copySync(sourceDir, targetDir);

  console.log("✅ 替换完成");
} catch (err) {
  console.error("❌ 替换失败:", err);
  process.exit(1);
}
