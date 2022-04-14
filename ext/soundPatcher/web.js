import {Config} from "../../lib/config.js";
const config = new Config("soundPatcher");

export const patches = [
  {
    find: {
      match: '"Hummus"',
    },
    replace: {
      match: /\(\)=>\(\{(.+)\}\)/,
      replacement: (_, body) =>
        `__chom_require("soundPatcher_sounds").wrap({${body}})`,
    },
  },
];

export const webpackModules = {
  sounds: {
    run: function (module, exports, wreq) {
      module.exports.wrap = function wrap(originalSounds) {
        return function getNotificationSounds() {
          const sounds = {...originalSounds};
          const ourSounds = config.getOptions();
          for (const soundId in ourSounds) {
            const sound = ourSounds[soundId];
            sounds[soundId] = {
              url: sound.url,
              display: () => sound.display,
            };
          }
          return sounds;
        };
      };
    },
  },
};
