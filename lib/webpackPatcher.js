import {patches} from "./modules";
import {get as getConfig} from "./config";
import Logger from "./logger";

const logger = new Logger("webpackPatcher");

export const needsInjecting = new Set(patches);

function createPatchDiff(patch, oldFunctionCode, err = null) {
  // How much context should we give? In other words, how far ahead/behind should we go
  const debugContext = getConfig().debugContext || 30;
  const match = oldFunctionCode.match(patch.replace.match);
  if (match === null) {
    logger.error("Patch %o isn't matching! How did this fire anyways?", patch);
    if (err) {
      console.error(err);
    }
    return;
  }
  const patchEnd = match.index + match[0].length;

  const prelude = oldFunctionCode.substring(
    // Would be Math.max(match.index - debugContext, 0) but substring doesn't care
    match.index - debugContext,
    match.index
  );
  const postlude = oldFunctionCode.substring(patchEnd, patchEnd + debugContext);

  // This is inefficient, but I'm NOT rewriting replace() logic...
  const replacement = match[0].replace(
    patch.replace.match,
    patch.replace.replacement
  );

  const format = [
    "color: #f38d68; font-weight: bolder",
    "color: #7188ce; font-weight: inherit",
    "color: #17a398",
    "color: #7188ce",
  ];

  console.error(
    "%cSomething went wrong while building a patch!%c Summarised diff of the erenous patch:\n" +
      "%cOld: %c" +
      prelude +
      "%c" +
      oldFunctionCode.substring(match.index, patchEnd) +
      "%c" +
      postlude +
      "%c\nNew: %c" +
      prelude +
      "%c" +
      replacement +
      "%c" +
      postlude +
      "%c" +
      "\nThe error was: %c%s%c\nWhile the patch in question was: %o",
    "font-weight: bolder; color: #d1495b",
    "font-weight: inherit; color: inherit",
    ...format,
    ...format,
    "color: inherit",
    "color: #d1495b; font-weight: bolder",
    err && err.message,
    "color: inherit; font-weight: inherit",
    patch
  );
}

export function patchModules(modules) {
  console.log("Got like, a hundred games to patch", modules);
  for (const patch of patches) {
    for (const moduleId in modules) {
      const generator = modules[moduleId];
      const generatorString = generator.toString();

      if (
        patch.find.match &&
        (typeof patch.find.match == "string"
          ? generatorString.indexOf(patch.find.match) != -1
          : patch.find.match.test(generatorString))
      ) {
        if (patch.replace.match) {
          const newContents = generatorString.replace(
            patch.replace.match,
            patch.replace.replacement
          );
          if (newContents == generatorString) {
            logger.warn(
              "Patch replacement doesn't fire?",
              patch,
              moduleId,
              patch
            );
          } else {
            logger.log(`Patched module ${moduleId}`);
            const completeNewContents = `(${newContents}).apply(this, arguments)`;
            try {
              // DUMB HACK DUMB HACK
              chomNative.generateFunction(completeNewContents, moduleId);
              modules[moduleId] = window.chomFunction;
            } catch (err) {
              createPatchDiff(patch, generatorString, err);
            }
          }
        }
      }
    }
  }
}
