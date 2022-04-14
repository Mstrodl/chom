#!/usr/bin/env node

const path = require("path");
const patcher = require(path.resolve(__dirname, "..", "lib", "patcher"));
const {realpathSync, statSync, existsSync} = require("fs");

if (process.argv.length < 3) {
  console.log("Usage: chom <path to slack executable>");
  console.log("  Examples:");
  console.log("    ~/.local/share/slack/slack");
  console.log("    /Applications/Slack.app/Contents/MacOS/Slack");
  process.exit(1);
}

const executable = realpathSync(process.argv[2]);
console.log("Slack executable:", executable);

if (!existsSync(executable)) {
  console.error("The provided file path is non-existent.");
  process.exit(1);
}
const stat = statSync(executable);
if (stat.isDirectory()) {
  console.error("The provided path points to a directory.");
  process.exit(1);
} else if (!stat.isFile()) {
  console.error("The provided file path is not a file.");
  process.exit(1);
}

console.log("Patching launcher.");
let packageDir = path.dirname(executable);
let isMac = false;
if (path.basename(packageDir).toLowerCase() == "macos") {
  isMac = true;
  packageDir = path.dirname(packageDir);
}
patcher
  .patch(
    path.join(packageDir, isMac ? "Resources" : "resources"),
    path.resolve(__dirname, ".."),
    function (data) {
      console.log(data);
    }
  )
  .then(() => {
    console.log("Launcher patched.");
  });
