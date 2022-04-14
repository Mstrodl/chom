let configValue = null;

class Config {
  constructor(id) {
    this.id = id;
  }
  getOptions() {
    const config = module.exports.get();

    if (!config.modules) {
      config.modules = {[this.id]: {options: {}}};
    } else if (!config.modules[this.id] || config.modules[this.id] === true) {
      const moduleOptions = {options: {}};
      if (config.modules[this.id] === true) {
        moduleOptions.enabled = true;
      }
      config.modules[this.id] = moduleOptions;
    } else if (!config.modules[this.id].options) {
      return (config.modules[this.id].options = {});
    }
    return config.modules[this.id].options;
  }
}

module.exports = {
  get() {
    if (configValue) {
      return configValue;
    }
    configValue = chomNative.config.get();
    return configValue;
  },
  write(value) {
    configValue = value;
    chomNative.config.write(value);
  },
  Config,
};
