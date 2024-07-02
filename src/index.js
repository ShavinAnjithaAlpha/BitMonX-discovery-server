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

// Default port for the server
const DEFAULT_PORT = 8765;

const routes = {
  '/bitmonx/register': ['POST', registerNewService],
  '/bitmonx/deregister': ['DELETE', deregisterService],
  '/bitmonx/heartbeat': ['POST', heartbeat],
  '/bitmonx/query/health': ['GET', queryHealth],
  '/bitmonx/query': ['GET', query],
  '/bitmonx/dashboard': ['GET', dashboard],
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
    const [method, controller] = routes[route];
    if (req.method === method) {
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
    // routes not match
    // bad request
    // res.statusCode = 400;
    // res.end('Bad Request');
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
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (data === '') {
        data = '{}';
      }
      req.body = JSON.parse(data);
      routeMapper(req, res);
    });
  });

  // start the WebSocket Server
  initWSS(server);

  // listen on the port specified in the config file
  const port = config.server.port || DEFAULT_PORT;
  server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });

  // initiate the health check task periodically
  setInterval(() => {
    healthCheck();
  }, 5000);

  setInterval(() => {
    sendResponseTime();
  }, 2000);
}

discovery();

module.exports = {
  discovery,
};
