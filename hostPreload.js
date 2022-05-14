const electron = require("electron");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const {EventEmitter} = require("events");
const {Module} = require("module");

module.exports.inject = function (injectionPoint) {
  process.env.SLACK_DEVELOPER_MENU = "true";

  global.chom = {
    emitter: new EventEmitter(),
  };
  const nodePreload = require.resolve("./nodePreload.js");
  class BrowserWindow extends electron.BrowserWindow {
    constructor(opts, ...rest) {
      if (!opts.webPreferences) opts.webPreferences = {};

      chom.emitter.emit("interceptBrowserWindow", opts);
      super(opts, ...rest);
      chom.emitter.emit("createdBrowserWindow", this);
      console.log("BrowserWindow has been created");

      let preloads = this.webContents.session.getPreloads();
      console.log("Current session's preloads", preloads);
      const nodeIndex = preloads.indexOf(nodePreload);
      if (nodeIndex == -1) {
        preloads = [nodePreload, ...preloads];
      } else if (nodeIndex != 0) {
        preloads = [nodePreload, ...preloads.splice(nodeIndex, 1)];
      }
      if (nodeIndex != 0) {
        this.webContents.session.setPreloads(preloads);
      }
      console.log("Attached preload to session!");
    }
  }
  Object.assign(BrowserWindow, electron.BrowserWindow);
  function registerSchemesAsPrivileged(schemes) {
    console.log("PATCHING URL SCHEMES!!!", schemes);
    const ourSchemes = [
      {
        scheme: "https",
        privileges: {
          bypassCSP: true,
        },
      },
      {
        scheme: "wss",
        privileges: {
          bypassCSP: true,
        },
      },
      // Same-Origin Policy who?
      {
        scheme: "http",
        privileges: {
          bypassCSP: true,
        },
      },
      {
        scheme: "ws",
        privileges: {
          bypassCSP: true,
        },
      },
      // Unclear why this is an issue...
      {
        scheme: "data",
        privileges: {
          bypassCSP: true,
        },
      },
    ];
    return electron.protocol.registerSchemesAsPrivileged(
      schemes.concat(ourSchemes)
    );
  }
  // registerSchemesAsPrivileged([]);
  const protocol = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop == "registerSchemesAsPrivileged") {
          return registerSchemesAsPrivileged;
        }
        return electron.protocol[prop];
      },
    }
  );

  const electronClone = {};
  for (const property of Object.getOwnPropertyNames(electron)) {
    if (property == "BrowserWindow") {
      Object.defineProperty(electronClone, property, {
        get: () => BrowserWindow,
        enumerable: true,
        configurable: false,
      });
    } else if (property == "protocol") {
      Object.defineProperty(electronClone, property, {
        get: () => protocol,
        enumerable: true,
        configurable: false,
      });
    } else {
      Object.defineProperty(
        electronClone,
        property,
        Object.getOwnPropertyDescriptor(electron, property)
      );
    }
  }

  const electronPath = require.resolve("electron");
  const cachedElectron = require.cache[electronPath];
  // we would just assign `exports`, but on windows it's a getter??
  require.cache[electronPath] = new Module(
    cachedElectron.id,
    cachedElectron.parent
  );
  require.cache[electronPath].exports = electronClone;

  console.log("Patched electron and applied cache");

  electronClone.ipcMain.on("__chom_internal_preload", (event) => {
    const customPath = path.join(__dirname, "dist", "webPreload.js");

    event.returnValue = {
      custom: {
        content: fs.readFileSync(customPath, "utf8"),
        path: customPath,
      },
    };
  });

  function getConfigPath() {
    console.log("Getting config path");
    const appData = electronClone.app.getPath("appData");
    const chomDir = path.join(appData, "chom");
    try {
      fs.mkdirSync(chomDir);
    } catch (err) {
      if (err.code != "EEXIST") {
        throw err;
      }
    }
    const configPath = path.join(chomDir, "slack.json");
    if (!fs.existsSync(configPath)) {
      fs.copyFileSync(path.join(__dirname, "default-config.json"), configPath);
    }
    console.log("Config path is", configPath);
    return configPath;
  }

  electronClone.ipcMain.on("__chom_internal_writeConfig", (event, config) => {
    fs.writeFileSync(getConfigPath(), config);
  });
  electronClone.ipcMain.on("__chom_internal_config", (event, config) => {
    try {
      event.returnValue = fs.readFileSync(getConfigPath(), "utf8");
    } catch (err) {
      console.error(err);
    }
  });

  electronClone.ipcMain.on("__chom_internal_getAppData", (event) => {
    event.returnValue = electronClone.app.getPath("appData");
  });
  electronClone.ipcMain.on("__chom_internal_getUserData", (event) => {
    event.returnValue = electronClone.app.getPath("userData");
  });
};
