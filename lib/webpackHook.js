import {patchModules} from "./webpackPatcher.js";
import {injectCustom} from "./webpackInjector.js";

export let realWebpackJsonp = null;

Object.defineProperty(window, "webpackJsonp", {
  get() {
    return realWebpackJsonp;
  },
  set(value) {
    realWebpackJsonp = value;
    const originalInjector = realWebpackJsonp.push;
    const canInject =
      !originalInjector.__chom_injected &&
      originalInjector != Array.prototype.push;
    value.push = function () {
      if (canInject) {
        for (let i = 0; i < arguments.length; ++i) {
          const [chunkNames, modules, entrypoints] = arguments[i];
          patchModules(modules);
        }
      }
      const response = originalInjector.apply(realWebpackJsonp, arguments);
      if (canInject) {
        for (let i = 0; i < arguments.length; ++i) {
          const [chunkNames, modules, entrypoints] = arguments[i];
          injectCustom(modules);
        }
      }
      return response;
    };
    if (canInject) {
      injectCustom([]);
    }
    value.push.__chom_injected = true;
  },
});
