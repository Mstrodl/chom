export const patches = [
  {
    find: {
      match:
        '"isFeatureEnabled must be passed a feature flag starting with feature_"',
    },
    replace: {
      match: /!!\((.)&&.\.bootData&&.\.bootData\[(.)\]\)/,
      replacement: (_, state, flagName) =>
        `!!(${flagName}=="feature_tinyspeck"||(${state}&&${state}.bootData&&${state}.bootData[${flagName}]))`,
    },
  },
  {
    find: {
      match: "No experiments matching <strong>{query}</strong>",
    },
    replace: {
      match:
        /=(Object\((.{1,2})\.(.)\)\("Calls API to get experiment config",)/,
      replacement: (_, original, redux, action) =>
        `=${redux}.${action}("Calls API to get experiment config", () => Promise.resolve({groups: ["treatment","off","on","control","enabled","disabled"],type:"experiments.getConfig"})); void ${original}`,
    },
  },
];
