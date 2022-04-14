const path = require("path");
const util = require("util");
const fs = require("fs").promises;
const asar = require("asar");

async function remove(dir) {
  const files = await fs.readdir(dir);

  const filePromises = new Map();
  for (const fileName of files) {
    const file = path.join(dir, fileName);
    filePromises.set(
      file,
      fs.lstat(file).then(async (stats) => {
        if (stats.isDirectory()) {
          await remove(file);
        } else {
          await fs.unlink(file);
        }
      })
    );
  }

  await Promise.all(filePromises.values());
  await fs.rmdir(dir);
}

module.exports.patch = async function (resourceDir, patchDir, log) {
  const patcherLib = path.join(__dirname, "..", "hostPreload.js");
  log("Cleaning up old data...");
  try {
    await remove(path.join(resourceDir, "app_extracted"));
  } catch (err) {
    if (err.code != "ENOENT") {
      throw err;
    }
  }
  log("Extracting asar");
  await asar.extractAll(
    path.join(resourceDir, "app.asar"),
    path.join(resourceDir, "app_extracted")
  );
  log("Patching asar");
  const bootPath = path.join(
    resourceDir,
    "app_extracted",
    "dist",
    "boot.bundle.js"
  );
  const contents = await fs.readFile(bootPath, "utf8");
  const startIndex = contents.indexOf("(()");
  await fs.writeFile(
    bootPath,
    `require(${JSON.stringify(patcherLib)}).inject();${contents.substring(
      startIndex
    )}`
  );
  log("Repatching asar");
  await asar.createPackage(
    path.join(resourceDir, "app_extracted"),
    path.join(resourceDir, "app.asar")
  );
  log("Wrote asar, patch complete!");
};
