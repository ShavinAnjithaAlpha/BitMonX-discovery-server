const { validateService } = require('../validation/service.validation');
const ServiceError = require('../error/ServiceError');
const ServiceRegistry = require('../registry/registry');
const InstanceError = require('../error/InstanceError');
const { result } = require('lodash');

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
  const serviceId = parseInt(req.query.serviceId);
  if (!serviceId) throw new ServiceError('Service id is required', 400);

  const instanceId = parseInt(req.query.instanceId);
  if (!instanceId) throw new ServiceError('Instance id is required', 400);

  // get the service registry
  const registry = ServiceRegistry.getRegistry();
  // deregister the service
  registry.deregisterInstance(serviceId, instanceId);

  res.end(JSON.stringify({ message: 'Service deregistered successfully' }));
}

function heartbeat(req, res) {
  // get the service id and instance id from the request query
  const serviceId = parseInt(req.query.serviceId);
  if (!serviceId) throw new ServiceError('Service id is required', 400);

  const instanceId = parseInt(req.query.instanceId);
  if (!instanceId) throw new ServiceError('Instance id is required', 400);

  ServiceRegistry.getRegistry().addHeartBeat(serviceId, instanceId);

  // Simulating asynchronous operation
  setTimeout(() => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  }, 100);
}

function query(req, res) {
  const mapping = req.query.mapping;
  if (!mapping) throw new ServiceError('Mapping is required', 400);

  // get the registry
  const registry = ServiceRegistry.getRegistry();
  // get the service that match with the mapping
  const sreviceMatched = registry.queryMapping(mapping);
  if (!sreviceMatched) throw new ServiceError('Service not found', 404);

  // get the one instance from the service
  const instance = sreviceMatched.getRandomInstance();
  if (!instance) {
    throw new InstanceError('UP Instance not found', 404);
  }

  // send the response with the instance ip address and port
  res.end(
    JSON.stringify({
      ip_address: instance.getIpAddress(),
      port: instance.getPort(),
    }),
  );
}

function fetchRegistry(req, res) {
  const filter = req.query.filter || 'ALL';

  const result = {};
  // get the service registry
  const registry = ServiceRegistry.getRegistry();
  if (filter === 'ALL') {
    // return the full registry to the client
    registry.getServices().forEach((service) => {
      const serviceJson = service.toJSON();
      // iterate over the instance of the service object
      const instances = [];
      service.getInstances().forEach((instance) => {
        instances.push(instance.toJSON());
      });

      serviceJson['instances'] = instances;
      result[service.getName()] = serviceJson;
    });

    res.end(JSON.stringify(result));
  } else if (filter === 'UP') {
    // return only the UP instance in the response to the client
    registry.getServices().forEach((service) => {
      const serviceJson = service.toJSON();
      // iterate over the instance of the service object
      const instances = [];
      service.getInstances().forEach((instance) => {
        if (instance.getStatus() === 'UP') {
          instances.push(instance.toJSON());
        }
      });

      serviceJson['instances'] = instances;
      result[service.getName()] = serviceJson;
    });
    res.end(JSON.stringify(result));
  } else if (filter === 'DOWN') {
    // retunn only the DOWN instance
    registry.getServices().forEach((service) => {
      const serviceJson = service.toJSON();
      // iterate over the instance of the service object
      const instances = [];
      service.getInstances().forEach((instance) => {
        if (instance.getStatus() === 'UP') {
          instances.push(instance.toJSON());
        }
      });

      serviceJson['instances'] = instances;
      result[service.getName()] = serviceJson;
    });
    res.end(JSON.stringify(result));
  } else {
    throw new Error('Invalid filter query argument: ' + filter);
  }
}

function queryHealth(req, res) {
  // get the service id and instance id from the request query
  const serviceId = parseInt(req.query.serviceId);
  if (!serviceId) throw new ServiceError('Service id is required', 400);

  const instanceId = parseInt(req.query.instanceId);
  if (!instanceId) throw new ServiceError('Instance id is required', 400);

  // make sure the service and instance exist
  const registry = ServiceRegistry.getRegistry();
  const service = registry.getServiceById(serviceId);

  if (!service) throw new ServiceError('Service not found', 404);

  // now fetch the instance from the service object
  const instance = service.getInstanceById(instanceId);
  if (!instance) throw new InstanceError('Instance not found', 404);

  // check whether if the instance is UP
  if (instance.getStatus() !== 'UP') {
    throw new InstanceError('Instance is DOWN', 404);
  }
  // now request the health data from the instance found
  fetch(
    `http://${instance.getIpAddress()}:${instance.getPort()}${service.getHealthCheckUrl()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
    .then((res) => res.json())
    .then((data) => {
      res.end(JSON.stringify(data));
    })
    .catch((err) => {
      throw new InstanceError(
        'Error while fetching health from the instance ' + instanceId,
        404,
      );
    });
}

// last N endpoints
function getLastNRegisteredServices(req, res) {
  // get the N from the path variable in the request url
  try {
    const N = parseInt(req.params.N);

    const registry = ServiceRegistry.getRegistry();
    const lastNRegisteredServices = registry
      .getLastNRegisteredServices()
      .getLastN(N);
    const results = [];
    lastNRegisteredServices.forEach((service) => {
      if (service != null) {
        results.push(service.toJSON(1));
      }
    });

    const response = {
      timestamp: new Date().toISOString(),
      requested: N,
      returned: results.length,
      values: results,
    };

    return res.end(JSON.stringify(response));
  } catch (err) {
    throw new Error(`Invalid N value: ${err}`);
  }
}

function getLastNRegisteredInstances(req, res) {
  // get the N from the path variable in the request url
  try {
    const N = parseInt(req.params.N);

    const registry = ServiceRegistry.getRegistry();
    const lastNRegisteredInstances = registry
      .getLastNRegisteredInstances()
      .getLastN(N);

    const results = [];
    lastNRegisteredInstances.forEach((instance) => {
      if (instance != null) {
        results.push(instance.toJSON());
      }
    });

    const response = {
      timestamp: new Date().toISOString(),
      requested: N,
      returned: results.length,
      values: results,
    };

    res.end(JSON.stringify(response));
  } catch (err) {
    throw new Error(`Invalid N value: ${err}`);
  }
}

function getLastNUpdatedInstances(req, res) {
  try {
    const N = parseInt(req.params.N);

    const registry = ServiceRegistry.getRegistry();
    const lastNUpdatedInstances = registry
      .getLastNUpdatedInstances()
      .getLastN(N);
    const results = [];

    lastNUpdatedInstances.forEach((instance) => {
      if (instance != null) {
        results.push(instance.toJSON());
      }
    });

    const response = {
      timestamp: new Date().toISOString(),
      requested: N,
      returned: results.length,
      values: results,
    };
    return res.end(JSON.stringify(response));
  } catch (err) {
    throw new Error(`Invalid N value: ${err}`);
  }
}

function getLastNCancelledInstances(req, res) {
  try {
    const N = parseInt(req.params.N);

    const registry = ServiceRegistry.getRegistry();
    const lastNCancelledInstances = registry
      .getLastNCancelledInstances()
      .getLastN(N);
    const results = [];

    lastNCancelledInstances.forEach((instance) => {
      if (instance != null) {
        results.push(instance.toJSON());
      }
    });

    const response = {
      timestamp: new Date().toISOString(),
      requested: N,
      returned: results.length,
      values: results,
    };

    return res.end(JSON.stringify(response));
  } catch (err) {
    throw new Error(`Invalid N value: ${err}`);
  }
}

module.exports = {
  registerNewService,
  deregisterService,
  heartbeat,
  query,
  queryHealth,
  fetchRegistry,
  getLastNRegisteredServices,
  getLastNRegisteredInstances,
  getLastNUpdatedInstances,
  getLastNCancelledInstances,
};
