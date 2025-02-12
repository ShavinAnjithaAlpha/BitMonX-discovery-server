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

const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const url = require('url');
const path = require('node:path');
const { init } = require('./start/db');
const { readLoadBalancer } = require('./load_balance/init');
const { requestParser } = require('./load_balance/index');
const {
  registerNewService,
  deregisterService,
  query,
  heartbeat,
  queryHealth,
  fetchRegistry,
  getLastNRegisteredServices,
  getLastNRegisteredInstances,
  getLastNUpdatedInstances,
  getLastNCancelledInstances,
} = require('./controller/discovery');
const { dashboard, serveStaticFile } = require('./controller/dashboard');
const errorHandler = require('./error/handler');
const { initWSS } = require('./socket');
const { healthCheck } = require('./tasks/health_check');
const sendResponseTime = require('./tasks/response_time');
const TokenBucket = require('./ratelimitter/tokenbucket');
const { handleLogin, renderLogin, logout } = require('./auth/login_handler');
const {
  handleRegistration,
  renderRegistration,
} = require('./auth/admin_register');
const { handleUpdateAdmin, renderUpdateAdmin } = require('./auth/admin_update');
const { handleDataInOut } = require('./controller/dataInOut');
const { sendDataInOutStat } = require('./tasks/data_in_out');
const { deleteAdminHandler } = require('./auth/admin_delete');
const Logger = require('./logger');
const RouteMap = require('./route_map');

class DiscoveryServer {
  // Default port for the server
  static DEFAULT_PORT = 8765;
  // logger instance for DiscoveryServer class
  static logger = Logger.logger('DiscoveryServer');

  constructor() {
    this.config = require('./read_config');
    this.server = null;
    this._isRateLimiting = false;
    this._tokenBucket = null;
    this.routeMap = new RouteMap();

    // setup the ratelimitter
    this.setUpRateLimitter();
    // read the load balancer from the configurations
    readLoadBalancer(this.config);
  }

  /**
   * Sets up the rate limiter for the discovery server.
   * If rate limiting is enabled in the configuration, it creates a token bucket
   * and enables rate limiting.
   *
   * @returns {void}
   */
  setUpRateLimitter() {
    // create a token bucket if rate limiting enabled
    if (this.config.ratelimiting) {
      DiscoveryServer.logger.info('ratelimiting setup successfully');

      this._tokenBucket = TokenBucket.build();
      this._isRateLimiting = true;
    }
  }

  /**
   * Starts the Discovery Server.
   *
   * This method serves as the entry point to the server. It performs the following tasks:
   * 1. Initializes the database.
   * 2. Creates and starts an HTTP or HTTPS server based on the configuration provided.
   * 3. Logs the initiation of the WebSocket server.
   * 4. Starts the WebSocket Server.
   * 5. Listens on the port specified in the configuration file or a default port.
   * 6. Logs that the server is listening on the specified port.
   * 7. Starts scheduled tasks.
   *
   * @throws {Error} Throws an error if the server fails to start.
   */
  start() {
    // initialize the database
    init();
    // register routes with the server
    DiscoveryServer.logger.info('all the routes mapped successfully');
    this.registerRoutes();
    // create a http/https server on specified port based on the configuration provided
    if (this.config.server.protocol === 'https') {
      this.startHttpsServer();
    } else {
      this.startHttpServer();
    }

    DiscoveryServer.logger.info(
      'starting websocket server socket on the discovery server',
    );
    // start the WebSocket Server
    initWSS(this.server);

    // listen on the port specified in the config file
    const port = this.config.server.port || DiscoveryServer.DEFAULT_PORT;

    this.server.listen(port, () => {
      DiscoveryServer.logger.info(
        `discovery server is listening on port ${port}`,
      );
    });

    // start schedules tasks
    this.initSchedulesTasks();
  }

  /**
   * Initializes and starts the HTTP server.
   * Logs the initialization process and creates an HTTP server instance
   * using the provided server handler.
   */
  startHttpServer() {
    DiscoveryServer.logger.info('initializing http server');
    this.server = http.createServer(this.serverHandler);
  }

  /**
   * Starts an HTTPS server using the provided key and certificate files from the configuration.
   *
   * This method performs the following steps:
   * 1. Retrieves the key and certificate file paths from the configuration.
   * 2. Checks if the key and certificate files exist.
   * 3. If either file is missing, logs an error message and exits the process.
   * 4. Reads the key and certificate files.
   * 5. Initializes and starts the HTTPS server with the provided key and certificate.
   *
   * @throws Will terminate the process if the key or certificate file is not found.
   */
  startHttpsServer() {
    // get the key and certificate file paths from the configs
    const key = path.join(__dirname, this.config.server.https.key);
    const cert = path.join(__dirname, this.config.server.https.cert);

    // check if the key and certificate files are present
    if (!fs.existsSync(key) || !fs.existsSync(cert)) {
      DiscoveryServer.logger.error(
        'key or certificate file is not found, exit from the server',
      );
      process.exit(1);
    }

    const options = {
      key: fs.readFileSync(key),
      cert: fs.readFileSync(cert),
    };
    DiscoveryServer.logger.info('reading key and certificate files');
    // start the server with key and certificate
    DiscoveryServer.logger.info('initializing https server');
    this.server = https.createServer(options, this.serverHandler);
  }

  registerRoutes() {
    this.routeMap.add('/register').addPOST(registerNewService);
    this.routeMap.add('/deregister').addDELETE(deregisterService);
    this.routeMap.add('/heartbeat').addPOST(heartbeat);
    this.routeMap.add('/query/health').addGET(queryHealth);
    this.routeMap.add('/query').addGET(query);
    this.routeMap
      .add('/services/last/:N', true)
      .addGET(getLastNRegisteredServices, this.getPathParser());
    this.routeMap
      .add('/instances/last/:N', true)
      .addGET(getLastNRegisteredInstances, this.getPathParser());
    this.routeMap
      .add('/instances/updated/last/:N', true)
      .addGET(getLastNUpdatedInstances, this.getPathParser());
    this.routeMap
      .add('/instances/last/:N/cancelled', true)
      .addGET(getLastNCancelledInstances, this.getPathParser());
    this.routeMap.add('/registry').addGET(fetchRegistry);
    this.routeMap.add('/dashboard').addGET(dashboard);
    this.routeMap.add('/login').addPOST(handleLogin).addGET(renderLogin);
    this.routeMap.add('/logout').addPOST(logout);
    this.routeMap
      .add('/admin/register')
      .addGET(renderRegistration)
      .addPOST(handleRegistration)
      .addPUT(handleUpdateAdmin);
    this.routeMap
      .add('/admin')
      .addGET(renderUpdateAdmin)
      .addPUT(handleUpdateAdmin)
      .addDELETE(deleteAdminHandler);
  }

  /**
   * Handles incoming HTTP requests by parsing the request body, setting up the response body size calculation,
   * and calling the middleware handler to process the request.
   * If rate limiting is enabled, the method checks the token bucket before processing the request.
   * If the token bucket is empty, the method returns a 429 status code.
   * @param {http.IncomingMessage} req - The incoming HTTP request object.
   * @param {http.ServerResponse} res - The server response object.
   * @returns {void}
   * @memberof DiscoveryServer
   *
   **/
  serverHandler = (req, res) => {
    // if ratelimiting is enabled then check the token bucket
    if (this._isRateLimiting) {
      // if the token bucket is empty then return 429
      if (!this._tokenBucket.consume(1)) {
        res.statusCode = 429;
        res.end('Too many requests');
        return;
      }
    }

    // parsing the request body
    let data = ''; // to store the request body as a string
    let requestBodySize = 0; // to store the request body size in bytes
    let responseBodySize = 0; // to store the response body size in bytes
    // when the request data is received
    req.on('data', (chunk) => {
      data += chunk;
      requestBodySize += chunk.length;
    });
    // when the request ends
    req.on('end', () => {
      // overwrite the request write and end method to calculate the response body size
      const originalWrite = res.write;
      const originalEnd = res.end;

      // overwrite the write method
      res.write = (chunk, encoding, callback) => {
        // calculate the response body size
        responseBodySize += Buffer.byteLength(chunk, encoding);
        // return to the original write method
        return originalWrite.call(res, chunk, encoding, callback);
      };

      // overwrite the end method
      res.end = (chunk, encoding, callback) => {
        if (chunk) {
          // calculate the response body size
          responseBodySize += Buffer.byteLength(chunk, encoding);
        }
        // pass the request and response body sized to the data in out handler
        handleDataInOut(req.url, requestBodySize, responseBodySize);
        // return to the orignal end method
        return originalEnd.call(res, chunk, encoding, callback);
      };

      // try to parse the request body as JSON
      try {
        req.body = JSON.parse(data); // attach the collected data to the request object
      } catch (err) {
        DiscoveryServer.logger.debug(
          `can't parse request body in json format: ${err}`,
        );
        req.body = data; // attach the collected data to the request object
      }
      this.getMiddlewareHandler()(
        req,
        res,
        [this.getQueryParser()],
        this.getRouteMapper(),
      ); // parse the request to the router
    });
  };

  /**
   * Returns a middleware handler function that executes an array of middleware functions in sequence.
   *
   * @returns {Function} Middleware handler function.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Array<Function>} middlewares - An array of middleware functions to be executed.
   * @param {Function} finalHandler - The final handler function to be executed after all middlewares.
   */
  getMiddlewareHandler() {
    return (req, res, middlewares, finalHandler) => {
      let index = 0;

      function next() {
        if (index < middlewares.length) {
          middlewares[index++](req, res, next);
        } else {
          finalHandler(req, res);
        }
      }

      next(); // executing the middleware functions
    };
  }

  /**
   * Middleware function to parse query parameters from the request URL.
   *
   * @returns {Function} Middleware function that parses query parameters and attaches them to the request object.
   *
   * @example
   * const express = require('express');
   * const app = express();
   * const getQueryParser = require('./path/to/this/file').getQueryParser;
   *
   * app.use(getQueryParser());
   *
   * app.get('/', (req, res) => {
   *   res.send(req.query); // Access parsed query parameters
   * });
   *
   * app.listen(3000, () => {
   *   console.log('Server is running on port 3000');
   * });
   */
  getQueryParser() {
    return (req, res, next) => {
      const parsedUrl = url.parse(req.url, true);
      req.query = parsedUrl.query; // attach parsed query parameters to the request object

      next(); // call the next middleware in the request handler chain
    };
  }

  /**
   * Parses path variables from the request URL based on the given pattern and attaches them to the request object.
   *
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   * @param {string} pattern - The URL pattern to match against the request URL.
   * @param {Function} next - The next middleware function in the request handler chain.
   */
  getPathParser() {
    return (req, res, pattern, next) => {
      const parsedUrl = url.parse(req.url, true);

      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      const patternSegments = pattern.split('/').filter(Boolean);

      let params = {};
      if (pathSegments.length === patternSegments.length) {
        patternSegments.forEach((segment, index) => {
          if (segment.startsWith(':')) {
            params[segment.substring(1)] = pathSegments[index];
          }
        });
      }

      req.params = params; // attach the params object to req object
      next(req, res); // call the next handler in the request handler chain
    };
  }

  /**
   * Returns a function that maps incoming requests to the appropriate controller based on the route and HTTP method.
   * If the route is not found, it attempts to serve static files or passes the request to the load balancer.
   *
   * @returns {Function} A function that handles incoming requests.
   */
  getRouteMapper() {
    return (req, res) => {
      // extract the request mapping
      const route = req.url.split('?')[0];

      // now map the routes to the controller
      if (this.routeMap.get(route)) {
        const router = this.routeMap.get(route);
        // called the specific route handler based on HTTP method requested
        if (router.get(req.method)) {
          const controller = router.get(req.method);
          try {
            controller(req, res);
          } catch (exp) {
            DiscoveryServer.logger.error(exp);
            errorHandler(exp, req, res);
          }
        } else {
          res.statusCode = 405;
          res.end('Method not allowed');
        }
      } else {
        // server static files // CSS and JS
        const status = this.serveStaticFiles(req, res);
        if (!status) {
          // parse the request to the load balancer for routing
          requestParser(req, res);
        }
      }
    };
  }

  /**
   * Serves static files based on the request URL.
   *
   * This method checks the request URL to determine the type of static file being requested
   * (CSS, JavaScript, or PNG image) and serves the appropriate file with the correct MIME type.
   *
   * @param {Object} req - The HTTP request object.
   * @param {string} req.url - The URL of the request.
   * @param {Object} res - The HTTP response object.
   * @returns {boolean} - Returns true if a static file was served, otherwise false.
   */
  serveStaticFiles(req, res) {
    if (req.url.match(/.css$/)) {
      const cssPath = path.join(__dirname, 'public', req.url);
      serveStaticFile(cssPath, 'text/css', res);
      return true;
    } else if (req.url.match(/.js$/)) {
      const jsPath = path.join(__dirname, 'public', req.url);
      serveStaticFile(jsPath, 'text/javascript', res);
      return true;
    } else if (req.url.match(/.png$/)) {
      const imgPath = path.join(__dirname, 'public', req.url);
      serveStaticFile(imgPath, 'image/png', res);
      return true;
    }

    return false;
  }

  /**
   * Initializes scheduled tasks on the server.
   *
   * This method logs the start of scheduled tasks and initializes
   * the health check and metric streaming tasks.
   */
  initSchedulesTasks() {
    DiscoveryServer.logger.info('starting scheduled tasks on the server');

    this.initHealthCheckTask();
    this.initMetricStreamingTask();
  }

  /**
   * Initializes a scheduled health check task that runs at a specified interval.
   * The interval duration is defined in the configuration.
   * Logs a message indicating the start of the health check task.
   */
  initHealthCheckTask() {
    setInterval(() => {
      healthCheck();
    }, this.config.health_check_interval);

    DiscoveryServer.logger.info(
      `started scheduled health check task with period ${this.config.health_check_interval} ms`,
    );
  }

  /**
   * Initializes a scheduled task to stream metrics at a specified interval.
   * The task sends response time and data in/out statistics.
   * The interval is defined by the `api_stat_send_interval` configuration property.
   * Logs the start of the scheduled task with the configured interval.
   */
  initMetricStreamingTask() {
    setInterval(() => {
      sendResponseTime();
      sendDataInOutStat();
    }, this.config.api_stat_send_interval);

    DiscoveryServer.logger.info(
      `started scheduled metric streaming task with period ${this.config.api_stat_send_interval} ms`,
    );
  }
}

module.exports = DiscoveryServer;
