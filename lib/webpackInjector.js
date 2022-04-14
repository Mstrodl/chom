import {needsInjecting} from "./modules.js";
import Logger from "./logger.js";

const logger = new Logger("Webpack Injector");

export let webpackChunkSeq = 69000;

export function injectCustom(modules, mogrify) {
  const injects = {modules: {}, entries: []};
  let doInject = false;

  if (needsInjecting.size) {
    for (const moduleId in modules) {
      const module = modules[moduleId];
      const moduleString = module.toString();
      for (const webpackModule of needsInjecting) {
        if (webpackModule.needs && webpackModule.needs.size) {
          for (const need of webpackModule.needs) {
            if (need.moduleId) {
              if (moduleId == need.moduleId) {
                webpackModule.needs.delete(need);
              }
            } else if (
              typeof need == "string"
                ? moduleString.indexOf(need) != -1
                : need.test(moduleString)
            ) {
              webpackModule.needs.delete(need);
            }
          }
          if (webpackModule.needs.size != 0) {
            continue;
          }
        }
        needsInjecting.delete(webpackModule);
        doInject = true;
        injects.modules[webpackModule.id] = webpackModule.run;
        if (webpackModule.entry) {
          injects.entries.push(webpackModule.id);
        }
      }
      if (!needsInjecting.size) break;
    }
  }

  if (doInject) {
    if (mogrify) {
      Object.assign(modules, injects.modules);
    } else {
      logger.info("Injecting modules now", injects);
      window.webpackJsonp.push([
        [--webpackChunkSeq],
        injects.modules,
        injects.entries.length ? injects.entries.map((entry) => [entry]) : [],
      ]);
    }
  }
}
