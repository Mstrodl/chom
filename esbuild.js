const ImportGlobPlugin = require("esbuild-plugin-import-glob").default;
const path = require("path");
const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["webPreload.js"],
    bundle: true,
    outfile: path.join(__dirname, "dist", "webPreload.js"),
    plugins: [ImportGlobPlugin()],
    watch: true,
  })
  .catch(() => process.exit(1));
