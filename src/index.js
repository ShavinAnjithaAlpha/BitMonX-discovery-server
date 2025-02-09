'use strict';

const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
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
const { url } = require('node:inspector');

class DiscoveryServer {
  // Default port for the server
  static DEFAULT_PORT = 8765;
  // logger instance for DiscoveryServer class
  static logger = Logger.logger('DiscoveryServer');

  static routes = {
    '/bitmonx/register': { POST: registerNewService },
    '/bitmonx/deregister': { DELETE: deregisterService },
    '/bitmonx/heartbeat': { POST: heartbeat },
    '/bitmonx/query/health': { GET: queryHealth },
    '/bitmonx/query': { GET: query },
    '/bitmonx/services/last': { GET: getLastNRegisteredServices },
    '/bitmonx/instances/last': { GET: getLastNRegisteredInstances },
    '/bitmonx/registry': { GET: fetchRegistry },
    '/bitmonx/dashboard': { GET: dashboard },
    '/bitmonx/login': { POST: handleLogin, GET: renderLogin },
    '/bitmonx/logout': { POST: logout },
    '/bitmonx/admin/register': {
      GET: renderRegistration,
      POST: handleRegistration,
      PUT: handleUpdateAdmin,
    },
    '/bitmonx/admin': {
      GET: renderUpdateAdmin,
      PUT: handleUpdateAdmin,
      DELETE: deleteAdminHandler,
    },
  };

  constructor() {
    this.config = require('./read_config');
    this.server = null;
    this._isRateLimiting = false;
    this._tokenBucket = null;

    // setup the ratelimitter
    this.setUpRateLimitter();
    // read the load balancer from the configurations
    readLoadBalancer(this.config);
  }

  /**
   * entry point of the BitMonX discovery server backed by node http server
   *
   *
   */
  start() {
    // initialize the database
    init();
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

  startHttpServer() {
    DiscoveryServer.logger.info('initializing http server');
    this.server = http.createServer(this.serverHandler);
  }

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

  serverHandler(req, res) {
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
      this.parseQueryParameters(req, res, this.mapRoutes(req, res)); // parse the request to the router
    });
  }

  parseQueryParameters(req, res, next) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query; // attach parsed query parameters to the request object

    next(); // call the next middleware in the request hadler chain
  }

  parsePathVariables(req, res, pattern, next) {
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
    next(); // call the next handler in the request handler chain
  }

  mapRoutes(req, res) {
    // extract the request mapping
    const route = req.url.split('?')[0];

    // now map the routes to the controller
    if (DiscoveryServer.routes[route]) {
      const router = DiscoveryServer.routes[route];
      if (router[req.method]) {
        const controller = router[req.method];
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
  }

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

  setUpRateLimitter() {
    // create a token bucket if rate limiting enabled
    if (this.config.ratelimiting) {
      DiscoveryServer.logger.info('ratelimiting setup successfully');

      this._tokenBucket = TokenBucket.build();
      this._isRateLimiting = true;
    }
  }

  initSchedulesTasks() {
    DiscoveryServer.logger.info('starting scheduled tasks on the server');

    this.initHealthCheckTask();
    this.initMetricStreamingTask();
  }

  initHealthCheckTask() {
    setInterval(() => {
      healthCheck();
    }, this.config.health_check_interval);

    DiscoveryServer.logger.info(
      `started scheduled health check task with period ${this.config.health_check_interval} ms`,
    );
  }

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
