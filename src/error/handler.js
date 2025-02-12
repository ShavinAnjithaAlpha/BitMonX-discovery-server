const Logger = require('../logger');

const logger = Logger.logger('errorHandler');
/*
 * errorHandler function
 * @function
 * @description Handle the error and send the response to the client
 * @param {Object} err - The error object
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
function errorHandler(err, req, res) {
  // log the error to the logger
  logger.error('Error: ', err.message);
  // send the error response to the client
  res.statusCode = err.status || 500;

  const errorMessage = {
    timestamp: new Date().toISOString(),
    status: res.statusCode,
    error: err.message,
  };
  res.end(JSON.stringify(errorMessage));
}

module.exports = errorHandler;
