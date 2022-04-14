import * as webModulesRaw from "../ext/*/web.js";
import * as moduleDataRaw from "../ext/*/meta.json";
import {get as getConfig} from "./config.js";
import Logger from "./logger";

const logger = new Logger("Module Resolver");
function resolveModules() {
  const webModules = {};
  const moduleData = {};
  for (let i = 0; i < webModulesRaw.filenames.length; ++i) {
    webModules[webModulesRaw.filenames[i].slice(7, -7)] =
      webModulesRaw.default[i];
  }
  for (let i = 0; i < moduleDataRaw.filenames.length; ++i) {
    moduleData[moduleDataRaw.filenames[i].slice(7, -10)] =
      moduleDataRaw.default[i];
  }

  const config = getConfig();
  const toLoad = new Set();
  const toLoadArray = [];
  for (const moduleName in config.modules) {
    if (
      (typeof config.modules[moduleName] == "object" &&
        config.modules[moduleName].enabled) ||
      config.modules[moduleName] === true
    ) {
      if (!toLoad.has(moduleName)) {
        toLoad.add(moduleName);
        toLoadArray.push(moduleName);
      }
    }
  }

  for (let i = 0; i < toLoadArray.length; ++i) {
    const moduleName = toLoadArray[i];
    const metadata = moduleData[moduleName];
    if (!metadata) {
      logger.error(
        `Couldn't find module ${moduleName}! Is it missing meta.json or misspelled?`
      );
      continue;
    }
    if (metadata.dependencies) {
      for (const moduleName of metadata.dependencies) {
        if (!toLoad.has(moduleName)) {
          toLoad.add(moduleName);
          toLoadArray.push(moduleName);
        }
      }
    }
  }
  const modules = {};
  for (const moduleName of toLoadArray) {
    if (webModules[moduleName]) {
      modules[moduleName] = {
        web: webModules[moduleName],
        metadata: moduleData[moduleName],
      };
    }
  }
  return modules;
}
const modules = resolveModules();

export const patches = new Set();
export const needsInjecting = new Set();
for (const moduleName in modules) {
  if (modules[moduleName].web.patches) {
    patches.add(...modules[moduleName].web.patches);
  }
  const webpackModules = modules[moduleName].web.webpackModules;
  if (webpackModules) {
    for (const id in webpackModules) {
      const webpackModule = webpackModules[id];
      webpackModule.run.__chom_module = true;
      needsInjecting.add({
        id: `${moduleName}_${id}`,
        needs: webpackModule.needs && new Set(webpackModule.needs),
        entry: webpackModule.entry,
        run: webpackModule.run,
      });
    }
  }
}
