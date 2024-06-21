function errorHandler(err, req, res) {
  console.error('Error: ', err.message);
  res.statusCode = err.status || 500;
  res.end(err.message);
}

module.exports = errorHandler;
