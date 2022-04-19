const ImportGlobPlugin = require("esbuild-plugin-import-glob").default;
const path = require("path");
const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["webPreload.js"],
    bundle: true,
    outfile: path.join(__dirname, "dist", "webPreload.js"),
    plugins: [ImportGlobPlugin()],
    watch: process.argv.slice(2).includes("--watch"),
  })
  .catch(() => process.exit(1));
