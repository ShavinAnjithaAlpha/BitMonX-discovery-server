const http = require('node:http');
const { init } = require('./start/db');
const {
  registerNewService,
  deregisterService,
  query,
} = require('./controller/discovery');
const errorHandler = require('./error/handler');

// Default port for the server
const DEFAULT_PORT = 8765;

const routes = {
  '/bitmonx/register': ['POST', registerNewService],
  '/bitmonx/deregister': ['DELETE', deregisterService],
  '/bitmonx/query': ['GET', query],
};

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
    // routes not match
    // bad request
    res.statusCode = 400;
    res.end('Bad Request');
  }
}

function discovery() {
  // first read theh global configurations from the config file
  const config = require('./read_config');
  // initialize the database
  init();
  // create a http server on specified port
  const server = http.createServer((req, res) => {
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

  // listen on the port specified in the config file
  const port = config.server.port || DEFAULT_PORT;
  server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}

discovery();

module.exports = {
  discovery,
};
