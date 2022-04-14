let configValue = null;
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
};
