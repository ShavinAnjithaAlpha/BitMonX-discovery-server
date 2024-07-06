const ServiceRegistry = require('../registry/registry');

function handleDataInOut(url, requestBodySize, responseBodySize) {
  // get the registry
  const matchedService = ServiceRegistry.getRegistry().getService(url);
  if (!matchedService) {
    return;
  }

  // update the service stat data for the matched service
  const dataInOut = matchedService.getDataInOut();
  // add those data to the dataInOut object
  dataInOut.incrementDataIn(requestBodySize);
  dataInOut.incrementDataOut(responseBodySize);
}

module.exports = {
  handleDataInOut,
};
