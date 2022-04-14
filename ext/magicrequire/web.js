import Logger from "../../lib/logger.js";

export const webpackModules = {
  require: {
    run: function (module, exports, wrequire) {
      const moduleCache = wrequire.c;
      const modules = wrequire.m;
      const magicLogger = new Logger("MagicRequire");

      module.exports.__esModule = true;
      module.exports.default = {
        modules,
        moduleCache,
        exportCache: function (keys) {
          const keyNames = (keys.some ? keys : [keys]).map((keyPath) =>
            keyPath.split(".")
          );
          // Wacky, I know
          const searchResults = Object.entries(moduleCache).filter(
            // Filter all modules
            ([moduleId, mod]) =>
              // Double negative here so if it's not not and thus is
              // Reason we use Array.prototype.some is because we can
              // get better performance as it stops our search after the first `true`
              // (which, in this case is a failure)
              !keyNames.some((keyPath) => {
                const keyValue = keyPath.reduce(
                  (combine, key) =>
                    // This is to make sure we don't match modules whose exports
                    // are falsy or falsy along the path
                    combine !== undefined &&
                    combine[key] !== undefined &&
                    combine[key] !== null
                      ? combine[key]
                      : undefined,
                  mod.exports
                );
                if (keyValue === undefined) {
                  if (mod.exports && mod.exports.default) {
                    const keyValue = keyPath.reduce(
                      (combine, key) =>
                        // This is to make sure we don't match modules whose exports
                        // are falsy or falsy along the path
                        combine !== undefined &&
                        combine[key] !== undefined &&
                        combine[key] !== null
                          ? combine[key]
                          : undefined,
                      mod.exports.default
                    );
                    return keyValue === undefined;
                  } else {
                    return true;
                  }
                }
                return false;
              })
          );
          return searchResults
            .map((itm) => itm[1])
            .filter((itm) => itm.exports !== window);
        },
        generatorText: function (search) {
          const searchArray = search instanceof Array ? search : [search];
          const overrideModules = wrequire.m;

          const searchResults = Object.entries(overrideModules).filter(
            ([id, generator]) =>
              !searchArray.some(
                (query) =>
                  !(query instanceof RegExp
                    ? generator.toString().match(query)
                    : generator.toString().includes(query))
              )
          );
          // We can't trust cache here.
          const required = searchResults.map(([i]) => ({
            i,
            exports: wrequire(i),
          }));
          return required;
        },
        require: (...args) => {
          magicLogger.silly("Requiring...", ...args);
          return wrequire(...args);
        },
        // Mostly exported for the purpose of accessing properties of require()
        // Really not recommended for using instead of require() as require() logs
        // for debugging purposes
        realRequire: wrequire,
      };
    },
  },
  windowExport: {
    run: function (module, exports, wrequire) {
      window.magicrequire = wrequire("magicrequire_require").default;
    },
    entry: true,
  },
};
