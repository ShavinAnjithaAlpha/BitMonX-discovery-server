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

const Joi = require('joi');

/*
 * Validate the service object
 * @function
 * @param {Object} service - The service object
 * @returns {Object} - The validation result
 */
function validateService(service) {
  const schema = Joi.object({
    name: Joi.string().max(255).required(),
    instance_name: Joi.string().max(255).optional(),
    mapping: Joi.string().max(255).required(),
    host: Joi.string().required(),
    port: Joi.number().min(1000).max(65536).required(),
    health_check_url: Joi.string().required(),
    health_check_interval: Joi.number().required(),
    timeout: Joi.number().required(),
    heartbeat: Joi.object({
      interval: Joi.number().required(),
      threshold: Joi.number().optional(),
    }).optional(),
    metadata: Joi.object({
      protocol: Joi.string().valid('http', 'https').required(),
      version: Joi.string().required(),
      environment: Joi.string().optional(),
      region: Joi.string().optional(),
    }).required(),
  });

  return schema.validate(service);
}

module.exports = {
  validateService,
};
