const ServiceRegistry = require('../registry/registry');

/*
 * request handler for request data in and out values of the Discovery Server
 * @param {string} url - the URL of the service
 * @param {number} requestBodySize - the size of the request body
 * @param {number} responseBodySize - the size of the response body
 * @returns {void}
 * */
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
