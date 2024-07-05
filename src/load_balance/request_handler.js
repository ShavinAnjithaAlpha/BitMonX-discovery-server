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

  const start_time = process.hrtime(); // start the timer
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
      // calculate the response time
      const elapsed_time = process.hrtime(start_time);
      const response_time = elapsed_time[0] * 1e3 + elapsed_time[1] * 1e-6;
      // update the instance stat
      instance.getStats().update(response_time, false);
    })
    .catch((error) => {
      // calculate the elapsed time
      const elapsed_time = process.hrtime(start_time);
      const response_time = elapsed_time[0] * 1e3 + elapsed_time[1] * 1e-6;
      // update the instance stat
      instance.getStats().update(response_time, true);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: 'Internal Server Error' }));
    });
}

module.exports = request_handle;
