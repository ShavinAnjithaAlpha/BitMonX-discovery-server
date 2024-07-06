const ServiceRegistry = require('../registry/registry');
const broadcastData = require('./socket_broadcast');

function sendDataInOutStat() {
  // get the registry
  const registry = ServiceRegistry.getRegistry();
  let totalDataIn = 0;
  let totalDataOut = 0;
  const data_metric = {};
  // iterate over the services and aggregate the result and also generate service vise object
  registry.getServices().forEach((service) => {
    // access the dataInOut object
    const dataInOut = service.getDataInOut();
    const data_in = dataInOut.getDataIn();
    const data_out = dataInOut.getDataOut();

    // push the service wise in/out data into the metric
    data_metric[service.getId()] = {
      in: data_in,
      out: data_out,
    };

    // aggregate the in and out data
    totalDataIn += data_in;
    totalDataOut += data_out;
    // reset the dataInOut object
    dataInOut.reset();
  });

  // build the broadcast data packet
  const data = {
    action: 'data_in_out',
    total: {
      in: totalDataIn,
      out: totalDataOut,
    },
    metric: data_metric,
  };
  // broadcast the data into the clients
  broadcastData(data);
}

module.exports = {
  sendDataInOutStat,
};
