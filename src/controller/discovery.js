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

function deregisterService(req, res) {
  // get the service id and instance id from the request query
  const serviceId = parseInt(req.query.get('serviceId'));
  if (!serviceId) throw new ServiceError('Service id is required', 400);

  const instanceId = parseInt(req.query.get('instanceId'));
  if (!instanceId) throw new ServiceError('Instance id is required', 400);

  // get the service registry
  const registry = ServiceRegistry.getRegistry();
  // deregister the service
  registry.deregisterInstance(serviceId, instanceId);

  res.end(JSON.stringify({ message: 'Service deregistered successfully' }));
}

function query(req, res) {}

module.exports = {
  registerNewService,
  deregisterService,
  query,
};
