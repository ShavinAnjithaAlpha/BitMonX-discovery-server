const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
const ServiceRegistry = require('../registry/registry');
const { authenticate } = require('../auth/login_handler');

function dashboard(req, res) {
  authenticate(req, res, () => {
    const templatePath = path.join(__dirname, '../views', 'dashboard.ejs');

    // Read the EJS file
    fs.readFile(templatePath, 'utf-8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error reading the template file.');
        return;
      }

      // Render the EJS template to HTML
      const renderedHtml = ejs.render(content, {
        services: ServiceRegistry.getRegistry().getServices(),
        instances_count: ServiceRegistry.getRegistry().numberOfInstances(),
        system_data: getSystemData(),
      });

      // Send the rendered HTML as the response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(renderedHtml);
    });
  });
}

function serveStaticFile(filePath, contentType, response) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      response.writeHead(500, { 'Content-Type': 'text/plain' });
      response.end('Error serving the static file.');
      return;
    }
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content);
  });
}

function getSystemData() {
  // get the config from the configuration files
  const config = require('../read_config');
  // create the system data object
  const systemData = {
    info: config.info,
    server: config.server,
    loadbalancer: config.loadbalancer.algorithm,
    ratelimiting: config.ratelimiting ? 'enabled' : 'disabled',
  };

  return systemData;
}

module.exports = {
  dashboard,
  serveStaticFile,
};
