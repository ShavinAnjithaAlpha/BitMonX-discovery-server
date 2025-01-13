'use strict';

const LEVELS = {
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
};

const DEFAULT_LEVEL = LEVELS.info;

/*
 * Logger class
 * @class
 * @classdesc A simple logger class
 * @param {number} level - The log level
 * @returns {Logger} - A new Logger object
 */
module.exports = class Logger {
  static _logger = null;

  constructor() {
    this._level = DEFAULT_LEVEL;
  }

  level(levelVal) {
    let val = levelVal;
    if (val) {
      if (typeof val === 'string') {
        val = LEVELS[val];
      }

      this._level = val || DEFAULT_LEVEL;
    }

    return this._level;
  }

  // abstract method to call console output stream
  _log(method, args) {
    if (LEVELS[method === 'log' ? 'debug' : method] >= this._level) {
      /* eslint-disable no-console */
      console[method](...args);
      /* eslint-enable no-console */
    }
  }

  error(...args) {
    return this._log('error', args);
  }

  warn(...args) {
    return this._log('warn', args);
  }

  info(...args) {
    return this._log('info', args);
  }

  debug(...args) {
    return this._log('log', args);
  }

  static setLogger(logger) {
    // user can pass custom logger if they want
    Logger._logger = logger;
  }

  static logger() {
    return Logger._logger;
  }
};
