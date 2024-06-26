function request_handle(instance, req, res) {
  // get the ip address and port of the instance and make the full url to make the request
  const ipAddress = instance.getIpAddress();
  const port = instance.getPort();
  const url = `http://${ipAddress}:${port}${req.url}`;

  const options = {
    method: req.method,
    headers: req.headers,
  };

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    options['body'] = req.body;
  }

  fetch(url, options)
    .then((response) => {
      // set the response status code
      res.statusCode = response.status;
      // set the headers
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }
      return response.text();
    })
    .then((data) => {
      res.end(data);
    })
    .catch((error) => {
      console.error(error);
      res.statusCode = 500;
      return res.end({ status: 'Internal Server Error' });
    });
}

module.exports = request_handle;
