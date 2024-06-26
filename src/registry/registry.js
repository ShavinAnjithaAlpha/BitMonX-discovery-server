const ServiceError = require('../error/ServiceError');
const Service = require('./service');

module.exports = class ServiceRegistry {
  // properties
  services = [];
  number_of_services = 0;
  number_of_instances = 0;
  static registry = null;

  constructor() {}

  static getRegistry() {
    if (this.registry == null) {
      this.registry = new ServiceRegistry();
    }
    return this.registry;
  }

  getServices() {
    return this.services;
  }

  getService(url) {
    const service = this.services.find((service) =>
      url.startsWith(service.getMapping()),
    );
    return service;
  }

  serviceExists(service_name) {
    return this.services.some((service) => service.getName() === service_name);
  }

  // register new service with the registry
  registerNewService(service) {
    // build new Service object and add it to the services array
    const serviceObj = Service.builder()
      .setName(service.name)
      .setMapping(service.mapping)
      .setHealthCheckUrl(service.health_check_url)
      .setHealthCheckInterval(service.health_check_interval ?? 5000)
      .setTimeout(service.timeout ?? 300000)
      .setVersion(service?.metadata?.version ?? '1.0.0')
      .setProtocol(service?.metadata?.protocol ?? 'http')
      .setEnv(service?.metadata?.env ?? 'development')
      .setHeartBeatInterval(service?.heartbeat?.interval ?? 10000)
      .build();

    // add the service to the services array
    this.services.push(serviceObj);

    // add the instances to the service object
    const instanceId = serviceObj.addInstance(
      service.host,
      service.port,
      service.instance_name ?? null,
    );
    const serviceId = serviceObj.getId();

    // increment the number of services and instances
    this.number_of_services++;
    this.number_of_instances++;

    console.log(
      `Service registered: ${service.name} | SERVICE_ID: ${serviceId} | INSTANCE_ID: ${instanceId}`,
    );

    return { serviceId, instanceId };
  }

  registerNewInstance(service) {
    // find the service with the given srevice name
    const serviceObj = this.services.find(
      (service_) => service_.getName() === service.name,
    );

    if (!serviceObj) throw new ServiceError('Service not found', 404);

    // find if the same instances is try to register again
    const instance = serviceObj.findInstanceWithURL(service.host, service.port);
    if (instance) {
      instance.setStatus('UP');
      return { serviceId: serviceObj.getId(), instanceId: instance.getId() };
    }

    // check whether mapping is match with the service mapping
    if (serviceObj.getMapping() !== service.mapping) {
      throw new ServiceError('Conflict: Service mapping does not match', 400);
    }

    // add the instances to the service object
    const instanceId = serviceObj.addInstance(
      service.host,
      service.port,
      service.instance_name ?? null,
    );
    // increment the number of instances
    this.number_of_instances++;

    console.log(
      `Service instance registered: ${serviceObj.name} | SERVICE_ID: ${serviceObj.id} | INSTANCE_ID: ${instanceId}`,
    );

    return { serviceId: serviceObj.getId(), instanceId };
  }

  deregisterInstance(service_id, instance_id) {
    // find the service with the given service id
    const serviceObj = this.services.find(
      (service) => service.getId() === service_id,
    );

    if (!serviceObj) throw new ServiceError('Service not found', 404);

    // remove the instance from the service object
    serviceObj.removeInstance(instance_id);
    // decrement the number of instances
    this.number_of_instances--;
    console.log(
      `Service instance deregistered: SERVICE_ID: ${service_id} | INSTANCE_ID: ${instance_id}`,
    );
    // get the number of instances of that service
    const instances = serviceObj.numberOfInstances();
    if (instances === 0) {
      // remove the service as well
      this.services = this.services.filter(
        (service) => service.getId() !== service_id,
      );

      // decrement the number of services
      this.number_of_services--;
      console.log(`Service deregistered: SERVICE_ID: ${service_id}`);
    }
  }

  numerOfServices() {
    return this.number_of_services;
  }

  numberOfInstances() {
    return this.number_of_instances;
  }

  addHeartBeat(service_id, instance_id) {
    // find the service with the given service id
    const serviceObj = this.services.find(
      (service) => service.getId() === service_id,
    );
    if (serviceObj == null) throw new ServiceError('Service not found', 404);

    // then add the heartbeat to the instance
    serviceObj.addHeartBeat(instance_id);
  }

  log() {
    // services names
    const services = this.services.map((service) => service.getName());
    console.log('Services:', services);

    // instances of each services
    this.services.forEach((service) => {
      console.log('Service:', service.getName());
      service.instances.forEach((instance) => {
        console.log('Instance:', instance.getId());
      });
    });
  }
};
