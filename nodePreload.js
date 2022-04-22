(async () => {
  try {
    console.log("[chom node] started!");
    const electron = require("electron");

    function expose(name, object) {
      try {
        console.log("Bridge expose", name, object);
        electron.contextBridge.exposeInMainWorld(name, object);
      } catch (err) {
        console.log("Setting window prop", name, object, err);
        window[name] = object;
      }
    }

    expose("chomNative", {
      config: {
        write(content) {
          return electron.ipcRenderer.sendSync(
            "__chom_internal_writeConfig",
            JSON.stringify(content, null, 2)
          );
        },
        get() {
          const config = electron.ipcRenderer.sendSync(
            "__chom_internal_config"
          );
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
    console.log("[chom node] exposed chomNative");

    // Execute our webPreload
    let preloadData;
    try {
      preloadData = electron.ipcRenderer.sendSync("__chom_internal_preload");
    } catch (err) {
      console.error("Error loading original preload", err);
      return;
    }
    console.log("[chom node] pulled original preload script");

    try {
      await electron.webFrame.executeJavaScript(
        `${preloadData.custom.content}
//# notsourceURL=file://${encodeURI(preloadData.custom.path)}`
      );
    } catch (err) {
      console.error("Couldn't load webPreload!", preloadData.custom.path, err);
    }
    console.log(
      "[chom node] executed chom web preload!",
      window.__SENTRY_IPC__
    );
  } catch (err) {
    console.error("Couldn't load nodePreload!", err.stack, err);
  }
})();
