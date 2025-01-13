### Service Object Response

```json
{
  "serviceId": "<service id>",
  "serviceName": "<service name>",
  "mapping": "<service mapping>",
  "healthCheckUrl": "<service health check url>",
  "numberOfInstances": "<number of instances>",
  "numberOfActiveInstances": "<number of active instances>",
  "registsredAt": "<service registration date>",
  "updatedAt": "<service last update date>"
}
```

### Instance Object Response

```json
{
  "instanceId": "<instance id>",
  "hostName": "<instance host name>",
  "ipAddr": "<instance ip address>",
  "port": "<instance port>",
  "status": "<instance status>",
  "serviceId": "<service id>",
  "registeredAt": "<instance registration date>",
  "updatedAt": "<instance last update date>"
}
```

### Instances of a service object

```json
{
    "service": {
        "serviceId": "<service id>",
        "serviceName": "<service name>",
        "mapping": "<service mapping>",
        "healthCheckUrl": "<service health check url>",
        "numberOfInstances": "<number of instances>",
        "numberOfActiveInstances": "<number of active instances>",
        "registsredAt": "<service registration date>",
        "updatedAt": "<service last update date>",
    },
    "instances": [
        {
            "instanceId": "<instance id>",
            "hostName": "<instance host name>",
            "ipAddr": "<instance ip address>",
            "port": "<instance port>",
            "status": "<instance status>",
            "serviceId": "<service id>",
            "registeredAt": "<instance registration date>",
            "updatedAt": "<instance last update date>"
        }, ...
    ],
}
```
