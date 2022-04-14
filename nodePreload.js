(async () => {
  const electron = require("electron");

  electron.contextBridge.exposeInMainWorld("chomNative", {
    config: {
      write(content) {
        return electron.ipcRenderer.sendSync(
          "__chom_internal_writeConfig",
          JSON.stringify(content, null, 2)
        );
      },
      get() {
        const config = electron.ipcRenderer.sendSync("__chom_internal_config");
        return JSON.parse(config);
      },
    },
    generateFunction(contents, moduleId) {
      // DUMB HACK DUMB HACK
      electron.webFrame.executeJavaScript(
        `window.chomFunction=(function(__chom_module,__chom_exports,__chom_require){
${contents}
})
//# sourceURL=Webpack-Module-${moduleId}`
      );
    },
  });

  // Execute the actual preload
  let preloadData;
  try {
    preloadData = electron.ipcRenderer.sendSync("__chom_internal_preload");
  } catch (err) {
    console.error("Error loading original preload", err);
    return;
  }

  try {
    await electron.webFrame.executeJavaScript(
      `${preloadData.custom.content}
//# notsourceURL=file://${encodeURI(preloadData.custom.path)}`
    );
  } catch (err) {
    console.error("Couldn't load webPreload!", preloadData.custom.path, err);
  }

  try {
    const preloadGenerator = new Function(
      "require",
      "process",
      "Buffer",
      "global",
      "setImmediate",
      "clearImmediate",
      "exports",
      preloadData.original.content
    );
    // TODO: We should probably not be giving away our `module` and associated functions

    preloadGenerator(
      require,
      process,
      Buffer,
      global,
      setImmediate,
      clearImmediate,
      exports
    );
  } catch (err) {
    console.error("Couldn't load original preload!", err);
  }
})();
