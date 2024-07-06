const http = require('node:http');
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

// Default port for the server
const DEFAULT_PORT = 8765;

const routes = {
  '/bitmonx/register': { POST: registerNewService },
  '/bitmonx/deregister': { DELETE: deregisterService },
  '/bitmonx/heartbeat': { POST: heartbeat },
  '/bitmonx/query/health': { GET: queryHealth },
  '/bitmonx/query': { GET: query },
  '/bitmonx/dashboard': { GET: dashboard },
  '/bitmonx/login': { POST: handleLogin, GET: renderLogin },
  '/bitmonx/logout': { POST: logout },
  '/bitmonx/admin/register': {
    GET: renderRegistration,
    POST: handleRegistration,
    PUT: handleUpdateAdmin,
  },
  '/bitmonx/admin/update': { GET: renderUpdateAdmin, PUT: handleUpdateAdmin },
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
        console.log(exp);
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

function discovery() {
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
  // create a http server on specified port
  const server = http.createServer((req, res) => {
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
      if (data === '') {
        data = '{}';
      }

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

      // req.requestBodySize = requestBodySize; // attach the request body size to the request object
      req.body = JSON.parse(data); // attach the collected data to the request object
      routeMapper(req, res); // parse the request to the router
    });
  });

  // start the WebSocket Server
  initWSS(server);

  // listen on the port specified in the config file
  const port = config.server.port || DEFAULT_PORT;
  server.listen(port, () => {
    console.log(`[SERVER] Server is listening on port ${port}`);
  });

  // initiate the health check task periodically
  setInterval(() => {
    healthCheck();
  }, 5000);

  setInterval(() => {
    sendResponseTime();
    sendDataInOutStat();
  }, 2000);
}

discovery();

module.exports = {
  discovery,
};
