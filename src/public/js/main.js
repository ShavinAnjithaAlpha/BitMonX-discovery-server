const ws = new WebSocket('ws://localhost:8765');

ws.onopen = function () {
  console.log('WebSocket connection established');
  ws.send('Hello Server!');
};

ws.onmessage = function (event) {
  // pasre the data as JSON data
  const data = JSON.parse(event.data);
  if (data.action === 'health') {
    // update the health of the service
    updateHealth(data);
  } else if (data.action === 'response_time') {
    // update the response time of the service
    pushResponseTimeData(data);
  } else if (data.action === 'instance_status') {
    // update the node's status
    updateNode(data);
  } else if (data.action === 'service_registered') {
    // add a new service to the services container
    addNewService(data.service);
  } else if (data.action === 'instance_registered') {
    // add a new instance to the service
    addNewInstance(data);
  }
};

ws.onclose = function () {
  console.log('WebSocket connection closed');
};

ws.onerror = function (error) {
  console.error('WebSocket error:', error);
};

function updateHealth(data) {
  // get the node element with service id and instance id received from the server
  const node = $(`#node-${data.service_id}-${data.instance_id}`);
  if (node.length) {
    // update the health status and data of the node
    node.find('.cpu').text(data.health.cpu_usage[0].usage.toFixed(2) + '%');
    node.find('.mem').text(data.health.memory_usage.usage.toFixed(2) + '%');
    node.find('.uptime').text(data.health.uptime.toFixed(2) + 's');
  }

  // push the data to the instances chart
  const chart = instancesChart;
  const time = new Date().toLocaleTimeString();
  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(data.health.cpu_usage[0].usage.toFixed(2));
  chart.data.datasets[1].data.push(data.health.memory_usage.usage.toFixed(2));
  chart.update();
}

function updateNode(data) {
  // get the node element by the service id and instance id
  const node = $(`#node-${data.service_id}-${data.instance_id}`);
  if (node.length) {
    // if data status is down change the color of the node to red and the text
    // get the status element
    const statusElement = node.find('.node-status');
    // set the color and text
    statusElement.text(data.status);
    if (data.status === 'DOWN') {
      statusElement.css('background-color', 'red');
    } else {
      statusElement.css('background-color', 'limegreen');
    }
  }
}

function addNewService(data) {
  console.log(data);
  // create a new service element
  const serviceElement = $(
    `<div class="service-card" id="service-${data.id}"></div>`,
  );
  // create the title bar of the service
  const titleBar = $("<div class='service-card__title__bar'></div>");
  // add h2 and span element to the title bar to show the service name and the protocol
  titleBar.append(`<h2>${data.name}</h2>`);
  titleBar.append(`<span>${data.protocol}</span>`);
  // create the service id element
  const serviceIdElement = $(
    `<p class='service-card__id' >Service ID: ${data.id}</p>`,
  );
  // create the p element for number of instances and number of up instances
  const instancesElement = $(`<p>Instances: 1 | Up: 1</p>`);
  // add the service mapping p element
  const serviceMappingElement = $(
    `<p class='service-card__mapping'>Mapping: ${data.mapping}</p>`,
  );

  // insert all teh subelement into the service element
  serviceElement.append(titleBar);
  serviceElement.append(serviceIdElement);
  serviceElement.append(instancesElement);
  serviceElement.append(serviceMappingElement);
  // append the service element to the services container
  $('.service-grid').append(serviceElement);
}

function addNewInstance(data) {
  console.log(data);
  // create a new node element
  const node = $(
    `<div class='node' id='node-${data.serviceId}-${data.instance.id}' ></div>`,
  );
  // create a title bar element for the node
  const titleBar = $("<div class='node__title__bar'></div>");
  // add instance id and status as a h2 and span to the title bar
  titleBar.append(`<h2>Node ${data.instance.id}</h2>`);
  titleBar.append(`<span class='node-status'>UP</span>`);

  // create a service name, ip address and port element
  const serviceElement = $(`<p class='node__service'>${data.service_name}</p>`);
  const ipElement = $(`<p>IP Address: ${data.instance.ip_address}</p>`);
  const portElement = $(`<p>Port: ${data.instance.port}</p>`);
  // insert a ul element
  const ul = $('<ul></ul>');
  // add cpu, mem ul element to the ul element
  ul.append('<li>CPU: <span class="cpu">0%</span></li>');
  ul.append('<li>Memory: <span class="mem">0%</span></li>');
  // add up time p element
  const uptime = $('<p>Uptime: <span class="uptime">0s</span></p>');
  // insert all the element to the node element
  node.append(titleBar);
  node.append(serviceElement);
  node.append(ipElement);
  node.append(portElement);
  node.append(ul);
  node.append(uptime);

  // add node to the node grid
  $(`.nodes-grid`).append(node);
}

// chart of the real time response time of the services registered in the discovery server
// created with Chart JS
const ctx = document.getElementById('response-time-chart').getContext('2d');

const responseTimeChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        data: [],
        fill: false,
        borderColor: '#f44336',
        tension: 0.1,
        pointRadius: 0,
        fill: true, // Enable area fill
        backgroundColor: '#f4433644', // Light blue area color
        borderColor: '#2196f3', // Line color
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    elements: {
      line: {
        borderWidth: 0.5,
      },
    },
  },
});

function pushResponseTimeData(data) {
  // get the chart object
  const chart = responseTimeChart;
  // get the current time
  const time = new Date().toLocaleTimeString();
  // add the time to the labels
  chart.data.labels.push(time);
  // add the response time to the datasets
  chart.data.datasets.forEach((dataset) => {
    dataset.data.push(data.total_avg_response_time);
  });
  // update the chart
  chart.update();

  // update the avg response time label
  $('#avg-response-time').text(
    Math.round(data.total_avg_response_time * 100) + 'ms',
  );
}

// line chart to show the total cpu usage and memory usage of the server
// created with Chart JS
const ctx2 = document.getElementById('instances-chart').getContext('2d');
const instancesChart = new Chart(ctx2, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'CPU Usage',
        data: [],
        fill: false,
        borderColor: '#f44336',
        tension: 0.1,
        pointRadius: 0,
        fill: true, // Enable area fill
        backgroundColor: 'rgba(244, 67, 54, 0.2)', // Light red area color
        borderColor: '#f44336', // Line color
      },
      {
        label: 'Memory Usage',
        data: [],
        fill: false,
        borderColor: '#2196f3',
        tension: 0.1,
        pointRadius: 0,
        fill: true, // Enable area fill
        backgroundColor: 'rgba(33, 150, 243, 0.2)', // Light blue area color
        borderColor: '#2196f3', // Line color
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    elements: {
      line: {
        borderWidth: 0.5,
      },
    },
  },
});
