/**
 * MIT License
 *
 * Copyright (c) 2024 Shavin Anjitha Chandrawansha
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

const fs = require('node:fs');
const Logger = require('./logger');
const _ = require('lodash');

const CONFIG_FILE_NAME = 'bitmonx.config.json';

/*
 * validate_config function
 * @function
 * @description Validate the configurations
 * @param {Object} config - The configurations
 */
function validate_config(config) {
  function validate(namespace, key) {
    if (!config[namespace][key]) {
      Logger.logger().error(
        `[bitmonx] Missing configuration: ${namespace}.${key}`,
      );
      process.exit(1);
    }
  }

  validate('info', 'name');
  validate('info', 'version');
  validate('server', 'ipaddress');
}

/*
 * read_config function
 * @function
 * @description Read the configurations from the config json file
 * @returns {Object} - The configurations
 */
function read_config() {
  // get the current working directory
  const cwd = process.cwd();

  // read the config file
  // look for config file in the current working directory
  const config_path = `${cwd}/${CONFIG_FILE_NAME}`;
  if (!fs.existsSync(config_path)) {
    Logger.logger().error(`[bitmonx] Config file not found: ${config_path}`);
    process.exit(1);
  }

  // read the config file
  const config = fs.readFileSync(config_path, 'utf8');
  const user_config = JSON.parse(config);
  const default_config = require('./default_config');
  // merge user config with the low priority default config
  const final_config = _.merge({}, user_config, default_config);
  validate_config(final_config);
  // return the final config
  return final_config;
}

// read the configurations and export the configurations
module.exports = read_config();
