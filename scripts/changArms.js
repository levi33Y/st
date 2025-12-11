const fs = require("fs");
const path = require("path");

const armsSetting = JSON.parse(process.env.ARMS_SETTING);

fs.writeFileSync(
  path.join(__dirname, "../src/arms/arms.json"),
  JSON.stringify(armsSetting),
  "utf8",
);
