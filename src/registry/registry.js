/**
 * MIT License
 *
 * Copyright (c) 2024 Shavin Anjitha Chandrawansha
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

const ServiceError = require('../error/ServiceError');
const Logger = require('../logger');
const broadcastData = require('../tasks/socket_broadcast');
const CircularQueue = require('./circular_queue');
const Service = require('./service');
const config = require('../read_config');
const ValueHolder = require('./value_holder');

module.exports = class ServiceRegistry {
  static logger = Logger.logger(ServiceRegistry.name);

  // properties
  services = [];
  number_of_services = 0;
  number_of_instances = 0;
  static registry = null;

  // queues for maintaining last N entries of different fields
  // default size for those queue is 1K
  // is specified in the configs, then it will be used as the queue size
  // there are 4 queues for 4 different fields
  // 1. last N registered services
  // 2. last N registered instances
  // 3. last N cancelled instances
  // 4. last deregistered instances
  // 5. last N updated instances
  lastNRegisteredServices = null;
  lastNRedisteredInstances = null;
  lastNCancelledInstances = null;
  lastNDeregisteredInstances = null;
  lastNUpdatedInstances = null;

  constructor() {
    let queue_size = config?.queue?.size || 1000;
    this.lastNRegisteredServices = new CircularQueue(queue_size);
    this.lastNRegisteredInstances = new CircularQueue(queue_size);
    this.lastNCancelledInstances = new CircularQueue(queue_size);
    this.lastNDeregisteredInstances = new CircularQueue(queue_size);
    this.lastNUpdatedInstances = new CircularQueue(queue_size);
  }

  getLastNRegisteredServices() {
    return this.lastNRegisteredServices;
  }

  getLastNRegisteredInstances() {
    return this.lastNRegisteredInstances;
  }

  getLastNCancelledInstances() {
    return this.lastNCancelledInstances;
  }

  getLastNDeregisteredInstances() {
    return this.lastNDeregisteredInstances;
  }

  getLastNUpdatedInstances() {
    return this.lastNUpdatedInstances;
  }

  static getRegistry() {
    if (this.registry == null) {
      this.registry = new ServiceRegistry();
    }
    return this.registry;
  }

  getServices() {
    return this.services;
  }

  getServiceById(service_id) {
    const service = this.services.find(
      (service) => service.getId() === service_id,
    );
    return service;
  }

  getService(url) {
    const service = this.services.find((service) =>
      url.startsWith(service.getMapping()),
    );
    return service;
  }

  queryMapping(mapping) {
    const service = this.services.find(
      (service) => service.getMapping() === mapping,
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

    // add to the last N registered services queue
    this.lastNRegisteredServices.push(new ValueHolder(serviceObj));
    // add to the last N registered instance queue
    this.lastNRegisteredInstances.push(
      new ValueHolder(serviceObj.getInstance(instanceId)),
    );

    // increment the number of services and instances
    this.number_of_services++;
    this.number_of_instances++;

    ServiceRegistry.logger.debug(
      `service registered: ${service.name} | SERVICE_ID: ${serviceId} | INSTANCE_ID: ${instanceId}`,
    );

    // broadcast the changes to the clients
    const broadcast_data = {
      action: 'service_registered',
      service: {
        id: serviceId,
        name: service.name,
        mapping: service.mapping,
        health_check_url: service.health_check_url,
        health_check_interval: service.health_check_interval ?? 5000,
        timeout: service.timeout ?? 300000,
        version: service?.metadata?.version ?? '1.0.0',
        protocol: service?.metadata?.protocol ?? 'http',
        env: service?.metadata?.env ?? 'development',
        heartbeat_interval: service?.heartbeat?.interval ?? 10000,
      },
    };
    broadcastData(broadcast_data);

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

    // add to the last N registered instances queue
    this.lastNRegisteredInstances.push(
      new ValueHolder(serviceObj.getInstance(instanceId)),
    );

    ServiceRegistry.logger.info(
      `service instance registered: ${serviceObj.name} | SERVICE_ID: ${serviceObj.id} | INSTANCE_ID: ${instanceId}`,
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

    // add to the last N deregistered instances queue
    this.lastNDeregisteredInstances.push(
      new ValueHolder({
        service: serviceObj,
        instanceId: instance_id,
      }),
    );

    // broadcast the changes to the clients
    const instance_data = {
      action: 'instance_deregistered',
      service_id,
      instance_id,
    };
    broadcastData(instance_data);
    // decrement the number of instances
    this.number_of_instances--;
    ServiceRegistry.logger.info(
      `service instance deregistered: SERVICE_ID: ${service_id} | INSTANCE_ID: ${instance_id}`,
    );

    // check whether if we have to remove the Service object as well
    // get the number of instances of that service
    const instances = serviceObj.numberOfInstances();
    // clear the intervals of the service object
    serviceObj.clearIntervals();
    if (instances === 0) {
      // remove the service as well
      this.services = this.services.filter(
        (service) => service.getId() !== service_id,
      );

      // decrement the number of services
      this.number_of_services--;
      ServiceRegistry.logger.debug(
        `service deregistered: SERVICE_ID: ${service_id}`,
      );

      // broadcast the changes to the clients
      const service_data = {
        action: 'service_deregistered',
        service_id,
      };
      broadcastData(service_data);
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

  cancelledInstance(service_id, instance_id) {
    const serviceObj = this.getServiceById(service_id);
    // get the instance object from the service object
    const instance = serviceObj.getInstance(instance_id);
    // add to the last N cancelled instances queue
    this.lastNCancelledInstances.push(new ValueHolder(instance));
  }

  log() {
    // services names
    const services = this.services.map((service) => service.getName());
    ServiceRegistry.logger.debug('services:', services);

    // instances of each services
    this.services.forEach((service) => {
      ServiceRegistry.logger.debug('service:', service.getName());
      service.instances.forEach((instance) => {
        ServiceRegistry.logger.debug('instance:', instance.getId());
      });
    });
  }
};
