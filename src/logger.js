'use strict';

const fs = require('fs');
const path = require('path');

const LEVELS = {
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
};

const DEFAULT_LEVEL = LEVELS.info;

// Function to get current timestamp in the required format
function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0]; // Format: YYYY-MM-DD HH:mm:ss
}

/*
 * Logger class
 * @class
 * @classdesc A simple logger class
 * @param {number} level - The log level
 * @returns {Logger} - A new Logger object
 */
module.exports = class Logger {
  static _logger = null;
  static DEFAULT_LOG_FILE = 'discovery.log';

  constructor(
    className,
    level = Logger.DEFAULT_LEVEL,
    logFile = Logger.DEFAULT_LOG_FILE,
    toFile = false,
    toConsole = true,
  ) {
    if (className == null) throw new Error('className is required');
    this.className = className;
    this._level = level;
    this._logFile = logFile;
    this._toFile = toFile;
    this._toConsole = toConsole;
    // construct the log file path based on current working directory
    this._logFilePath = path.join(__dirname, this._logFile);
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
      const logMessage = `[${getTimestamp()}] [${method.toUpperCase()}] [${
        this.className
      }] ${args}`;
      if (this._toConsole) {
        // eslint-disable-next-line no-console
        console[method](logMessage);
        // eslint-enable-next-line no-console
      }

      // write to the log file if enabled
      if (this._toFile) {
        fs.appendFile(this._logFilePath, `${logMessage}\n`, (err) => {
          if (err) {
            // eslint-disable-next-line no-console
            console.error(`Error writing to log file: ${err}`);
            // eslint-enable-next-line no-console
          }
        });
      }
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

  static logger(className) {
    // config for logger
    const filePath = 'discovery.log';
    const level = 'debug';

    return new Logger(className, LEVELS.debug, filePath, true, true);
  }
};
