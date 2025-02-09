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

// Default port for the server
const DEFAULT_PORT = 8765;

const routes = {
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

function serveStaticFiles(req, res) {
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

function routeMapper(req, res) {
  const logger = Logger.logger('routeMapper');
  // parse the query parameter
  req.query = new URL(req.url, `https://${req.headers.host}`).searchParams;
  // extract the request mapping
  const route = req.url.split('?')[0];

  // now map the routes to the controller
  if (routes[route]) {
    const router = routes[route];
    if (router[req.method]) {
      const controller = router[req.method];
      try {
        controller(req, res);
      } catch (exp) {
        logger.error(exp);
        errorHandler(exp, req, res);
      }
    } else {
      res.statusCode = 405;
      res.end('Method not allowed');
    }
  } else {
    // server static files // CSS and JS
    const status = serveStaticFiles(req, res);
    if (!status) {
      // parse the request to the load balancer for routing
      requestParser(req, res);
    }
  }
}

function discovery(_logger = null) {
  // set the logger first
  Logger.setLogger(_logger || new Logger('bitmonx'));
  // create a logger for the application
  const logger = Logger.logger('bitmonx');
  // first read theh global configurations from the config file
  const config = require('./read_config');
  // read the load balancer from the configurations
  readLoadBalancer(config);
  // initialize the database
  init();

  // create a token bucket if rate limiting enabled
  let tokenBucket = null;
  let ratelimiting = false;
  if (config.ratelimiting) {
    tokenBucket = TokenBucket.build();
    ratelimiting = true;
  }

  const serverHandler = (req, res) => {
    // if ratelimiting is enabled then check the token bucket
    if (ratelimiting) {
      // if the token bucket is empty then return 429
      if (!tokenBucket.consume(1)) {
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
        req.body = data; // attach the collected data to the request object
      }
      routeMapper(req, res); // parse the request to the router
    });
  };
  // create a http/https server on specified port based on the configuration provided
  let server;
  if (config.server.protocol === 'https') {
    // get the key and certificate file paths from the configs
    const key = path.join(__dirname, config.server.https.key);
    const cert = path.join(__dirname, config.server.https.cert);

    // check if the key and certificate files are present
    if (!fs.existsSync(key) || !fs.existsSync(cert)) {
      logger.error('key or certificate file not found');
      process.exit(1);
    }

    const options = {
      key: fs.readFileSync(key),
      cert: fs.readFileSync(cert),
    };
    // start the server with key and certificate
    server = https.createServer(options, serverHandler);
  } else {
    server = http.createServer(serverHandler);
  }

  // start the WebSocket Server
  initWSS(server);

  // listen on the port specified in the config file
  const port = config.server.port || DEFAULT_PORT;

  server.listen(port, () => {
    logger.debug(`server is listening on port ${port}`);
  });

  // initiate the health check task periodically
  setInterval(() => {
    healthCheck();
  }, config.health_check_interval);

  setInterval(() => {
    sendResponseTime();
    sendDataInOutStat();
  }, config.api_stat_send_interval);
}

module.exports = {
  discovery,
};
