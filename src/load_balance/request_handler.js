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

const Logger = require('../logger');

/*
 * This function is used to handle the request from the client
 * It makes a request to the appropriate instance and returns the response to the client
 * It also updates the instance stats
 * @param {Instance} instance - The instance to make the request to
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {void}
 * */
function request_handle(instance, req, res) {
  // get the ip address and port of the instance and make the full url to make the request
  const ipAddress = instance.getIpAddress();
  const port = instance.getPort();
  const url = `http://${ipAddress}:${port}${req.url}`;

  const options = {
    method: req.method,
    headers: req.headers,
  };

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    options['body'] = req.body;
  }

  const start_time = process.hrtime(); // start the timer
  fetch(url, options)
    .then((response) => {
      // set the response status code
      res.statusCode = response.status;
      // set the headers
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }
      return response.text();
    })
    .then((data) => {
      res.end(data);
      // calculate the response time
      const elapsed_time = process.hrtime(start_time);
      const response_time = elapsed_time[0] * 1e3 + elapsed_time[1] * 1e-6;
      // update the instance stat
      instance.getStats().update(response_time, false);
    })
    .catch((error) => {
      // calculate the elapsed time
      const elapsed_time = process.hrtime(start_time);
      const response_time = elapsed_time[0] * 1e3 + elapsed_time[1] * 1e-6;
      // update the instance stat
      instance.getStats().update(response_time, true);
      // log the error
      Logger.logger().error('Error in request handler: ', error);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: 'Internal Server Error' }));
    });
}

module.exports = request_handle;
