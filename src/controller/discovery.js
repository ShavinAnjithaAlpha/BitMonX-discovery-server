const { validateService } = require('../validation/service.validation');
const ServiceError = require('../error/ServiceError');
const ServiceRegistry = require('../registry/registry');

function registerNewService(req, res) {
  // validate the request body
  const { error } = validateService(req.body);
  if (error) throw new ServiceError(error.details[0].message, 400);

  // get the service registry
  const registry = ServiceRegistry.getRegistry();
  // first check whether the service already exists
  const exists = registry.serviceExists(req.body.name);
  let result;
  if (exists) {
    result = registry.registerNewInstance(req.body);
  } else {
    result = registry.registerNewService(req.body);
  }

  // send the service id and the instance id as response
  res.end(
    JSON.stringify({
      serviceId: result.serviceId,
      instanceId: result.instanceId,
    }),
  );
}

function deregisterService(req, res) {}

function query(req, res) {}

module.exports = {
  registerNewService,
  deregisterService,
  query,
};
