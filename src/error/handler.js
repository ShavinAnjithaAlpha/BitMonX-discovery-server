const Logger = require('../logger');

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
  Logger.logger().error('Error: ', err.message);
  // send the error response to the client
  res.statusCode = err.status || 500;
  res.end(JSON.stringify({ error: err.message }));
}

module.exports = errorHandler;
