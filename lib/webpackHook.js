import {patchModules} from "./webpackPatcher.js";

export let realWebpackJsonp = null;

Object.defineProperty(window, "webpackJsonp", {
  get() {
    return realWebpackJsonp;
  },
  set(value) {
    realWebpackJsonp = value;
    const originalInjector = realWebpackJsonp.push;
    value.push = function () {
      if (
        !originalInjector.__chom_injected &&
        originalInjector != Array.prototype.push
      ) {
        for (let i = 0; i < arguments.length; ++i) {
          const [chunkNames, modules, entrypoints] = arguments[i];
          console.log("We be pushing for chunks", chunkNames);
          patchModules(modules);
        }
      }
      console.log("Trying original now...");
      originalInjector.apply(realWebpackJsonp, arguments);
      console.log("Finished out realWebpackJsonp.push");
    };
    value.push.__chom_injected = true;
  },
});
