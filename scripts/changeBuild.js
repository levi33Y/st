const fs = require("fs");
const path = require("path");

// 读取package.json文件
const packageJsonPath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

// 获取命令行参数中的键值对
const args = process.argv.slice(2);
const keyValueRegex = /([^=]+)=(.*)/;
args.forEach((arg) => {
  const match = arg.match(keyValueRegex);
  if (match) {
    const [, key, value] = match;
    packageJson[key] = value;
  } else {
    process.exit(1);
  }
});

// 将修改后的内容写回package.json文件
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), "utf8");
