import { get, isFunction, isUndefined, isString, isValidString, isPlainObject } from "@kubric/litedash";

export default class FeatureGates {
  static initialized = false;

  constructor({ firestore, path, gates = {}, logger, logOnReload = false, onLoaded, translateMap = {}, filterMap }) {
    this.db = firestore;
    this.rawGates = gates || {};
    if (this.db) {
      if (!isValidString(path)) {
        throw new Error(`Invalid string provided as "path"`);
      }
      this.gatesRef = this.db.doc(path);
    }
    if (logOnReload && isUndefined(logger)) {
      throw new Error(`"logger" should be provided if "logOnReload" needs to be enabled`);
    }
    if (!isUndefined(logger) && !isFunction(logger.info)) {
      throw new Error(`"logger" should be an object with an "info" function`);
    }
    if (!isUndefined(onLoaded) && !isFunction(onLoaded)) {
      throw new Error(`"onLoaded" should be a function`);
    }
    this.options = {
      logOnReload,
      onLoaded,
      translateMap,
      filterMap
    };
    this.logger = logger;
  }

  translate(gates = {}) {
    gates = JSON.parse(JSON.stringify(gates));
    const { translateMap = {} } = this.options;
    const keys = Object.keys(translateMap);
    if (keys.length > 0) {
      return keys.reduce((acc, key) => {
        const conf = translateMap[key];
        let path = conf, defaultValue, transformer;
        if (!isString(conf)) {
          path = conf.path || '';
          defaultValue = conf.defaultValue;
          transformer = conf.transformer;
        }
        let value = get(gates, path, defaultValue);
        if (isFunction(transformer)) {
          value = transformer(value);
        }
        acc[key] = value;
        return acc;
      }, {});
    }
    return gates;
  }

  async initialize() {
    if (!FeatureGates.initialized && this.gatesRef) {
      return new Promise((resolve, reject) => {
        this.gatesRef.onSnapshot(async snap => {
          try {
            this.rawGates = snap.data();
            this.load();
            !FeatureGates.initialized && resolve();
            FeatureGates.initialized = true;
          } catch (ex) {
            reject(ex);
          }
        });
      });
    } else {
      this.load();
      return Promise.resolve();
    }
  }

  load() {
    const { logOnReload, onLoaded } = this.options;
    this.featureGates = this.translate(this.rawGates);
    logOnReload && this.logger.info({
      message: "Feature gates loaded",
      received: this.rawGates,
      translated: this.featureGates
    });
    onLoaded && setImmediate(onLoaded, this.featureGates);
  }

  get(...args) {
    let [fgName, { defaultValue, filters } = {}] = args;
    const getFilteredFGValue = (fgName, filters) => {
      const filterFunc = this.options.filterMap[fgName];
      const currentValue = this.featureGates[fgName];
      return isFunction(filterFunc) ? filterFunc(currentValue, filters) : currentValue;
    }
    if (isString(fgName) && isUndefined(filters)) {
      return get(this.featureGates, fgName, defaultValue);
    } else if (isString(fgName) && isPlainObject(filters)) {
      return getFilteredFGValue(fgName, filters)
    } else if (isPlainObject(fgName)) {
      filters = fgName;
      return Object.keys(this.featureGates)
        .reduce((acc, fgName) => {
          acc[fgName] = getFilteredFGValue(fgName, filters);
          return acc;
        }, {});
    }
    return this.featureGates;
  }

  set(gates, shouldTranslate = true) {
    if (shouldTranslate) {
      gates = this.translate(gates);
    }
    this.featureGates = gates;
  }
}