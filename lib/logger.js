const getConfig = require("./config.js").get;

// clrs.cc
const colors = {
  aqua: "#7fdbff",
  blue: "#0074d9",
  lime: "#01ff70",
  navy: "#001f3f",
  teal: "#39cccc",
  olive: "#3d9970",
  green: "#2ecc40",
  red: "#ff4136",
  maroon: "#85144b",
  orange: "#ff851b",
  purple: "#b10dc9",
  yellow: "#ffdc00",
  fuchsia: "#f012be",
  gray: "#aaaaaa",
  white: "#ffffff",
  black: "#111111",
  silver: "#dddddd",
};

const LEVEL_COLORS = {
  silly: [colors.silver, colors.black, 100],
  verbose: [colors.gray, colors.black, 200],
  debug: [colors.lime, colors.black, 300],
  log: [colors.blue, colors.white, 400],
  info: [colors.fuchsia, colors.white, 500],
  warn: [colors.orange, colors.white, 600],
  error: [colors.red, colors.white, 700],
};

const DEFAULT_LEVEL = 400;

class Logger {
  constructor(
    id = "Unidentified Logger",
    {background, color} = {background: colors.black, color: colors.white}
  ) {
    this.id = id;
    this.background = background;
    this.color = color;
  }

  prefix(level) {
    const [background, color] = LEVEL_COLORS[level] || ["#fff", "#000"];
    const reset = "background: inherit: color: inherit";

    return [
      `%c%c[Node]%c %c[${this.id}]%c %c[${level.toUpperCase()}]%c`,
      "line-height: 2; padding: 5px 0;",
      // Node
      "background: #000; color: #fff",
      reset,

      `background: ${this.background}; color: ${this.color}`,
      reset,
      `background: ${background}; color: ${color}`,
      reset,
    ];
  }
}

const config = getConfig();
function getMinLevel(id) {
  if (config.loggers && id in config.loggers) {
    return config.loggers[id];
  } else if (config.defaultLoggerLevel) {
    return config.defaultLoggerLevel;
  }
  return DEFAULT_LEVEL;
}

for (const level of Object.keys(LEVEL_COLORS)) {
  Logger.prototype[level] = function (...args) {
    const minLevel = getMinLevel(this.id);
    console.log(`We want to log`, args, minLevel);
    if (LEVEL_COLORS[level][2] < minLevel) {
      return;
    }
    (console[level] || console.log)(...this.prefix(level), ...args);
  };
}

export default Logger;
