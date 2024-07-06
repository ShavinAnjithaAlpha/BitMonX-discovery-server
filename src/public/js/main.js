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
  } else if (data.action === 'data_in_out') {
    handleDataInOut(data);
  }
};

ws.onclose = function () {
  console.log('WebSocket connection closed');
};

ws.onerror = function (error) {
  console.error('WebSocket error:', error);
};

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
      updateUpInstanceCount(data.service_id, -1);
    } else {
      statusElement.css('background-color', 'limegreen');
      updateUpInstanceCount(data.service_id, 1);
    }
  }
}

function updateUpInstanceCount(service_id, count) {
  const serviceElement = $(`#service-${service_id}`);
  if (serviceElement.length) {
    const instancesElement = serviceElement.find('.service-card__uc');
    // get the current number of up instances
    const upInstances = parseInt(instancesElement.text());
    instancesElement.text(`${count + upInstances} UP`);
  }
}

function updateInstanceCount(service_id, count) {
  const serviceElement = $(`#service-${service_id}`);
  if (serviceElement.length) {
    const instancesElement = serviceElement.find('.service-card__ic');
    // get the current number of up instances
    const upInstances = parseInt(instancesElement.text());
    instancesElement.text(`${count + upInstances} Instance`);
  }
}

function addNewService(data) {
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
  const instancesElement = $(`<p></p>`);
  // add two span element to the instances element
  instancesElement.append(`<span class='service-card__ic'> 1 Instance </span>`);
  instancesElement.append("<span class='service-card__uc'> 1  UP </span>");
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

  // get the total services element
  const totalServicesElement = $('#total_services');
  if (totalServicesElement) {
    // get its text and converted to a number
    let totalServices = parseInt(totalServicesElement.text());
    totalServicesElement.text(totalServices + 1);
  }

  // hide the no services element
  hideNoServices();
}

function hideNoInstances() {
  // hide the no instances element
  $('.no-instances').hide();
}

function hideNoServices() {
  // hide the no services element
  $('.no-services').hide();
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
        label: 'response time',
        data: [],
        tension: 0.1,
        pointRadius: 0,
        fill: true, // Enable area fill
        backgroundColor: '#2196f344', // Light blue area color
        borderColor: '#2196f3', // Line color
      },
    ],
  },
  options: {
    scales: {
      x: {
        // Configuring the x-axis
        grid: {
          display: true, // Display grid lines
          color: 'rgba(0, 0, 255, 0.2)', // Grid line color
          borderColor: 'rgb(54, 162, 235)', // Border color
          borderWidth: 2, // Border width
          drawBorder: true, // Draw border around the chart
          drawOnChartArea: true, // Draw grid lines in the chart area
          drawTicks: true, // Draw ticks on the scale
          tickColor: 'rgba(75, 192, 192, 0.2)', // Tick color
          tickLength: 10, // Tick length
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true, // Display grid lines
          color: 'rgba(0, 0, 255, 0.2)', // Grid line color
          borderColor: 'rgb(54, 162, 235)', // Border color
          borderWidth: 2, // Border width
          drawBorder: true, // Draw border around the chart
          drawOnChartArea: true, // Draw grid lines in the chart area
          drawTicks: true, // Draw ticks on the scale
          tickColor: 'rgba(75, 192, 192, 0.2)', // Tick color
          tickLength: 10, // Tick length
        },
      },
    },
    elements: {
      line: {
        borderWidth: 0.5,
      },
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: 'min-max', // or 'lttb'
        samples: 500, // Number of points to keep
      },
    },
  },
});

// chart of the real time response time of the services registered in the discovery server
// created with Chart JS
const ctx3 = document.getElementById('total-requets-chart').getContext('2d');

const totalRequetsChart = new Chart(ctx3, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Total Requests',
        data: [],
        borderColor: '#FE9900',
        tension: 0.1,
        pointRadius: 0,
        fill: true, // Enable area fill
        backgroundColor: '#FE990055',
      },
    ],
  },
  options: {
    scales: {
      x: {
        // Configuring the x-axis
        grid: {
          display: true, // Display grid lines
          color: '#FE990055', // Grid line color
          borderColor: '#FE990055', // Border color
          borderWidth: 2, // Border width
          drawBorder: true, // Draw border around the chart
          drawOnChartArea: true, // Draw grid lines in the chart area
          drawTicks: true, // Draw ticks on the scale
          tickColor: '#FE990055', // Tick color
          tickLength: 10, // Tick length
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true, // Display grid lines
          color: '#FE990055', // Grid line color
          borderColor: '#FE990055', // Border color
          borderWidth: 2, // Border width
          drawBorder: true, // Draw border around the chart
          drawOnChartArea: true, // Draw grid lines in the chart area
          drawTicks: true, // Draw ticks on the scale
          tickColor: '#FE990055', // Tick color
          tickLength: 10, // Tick length
        },
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

  // update the total requests label
  const totalRequestChart = totalRequetsChart;
  totalRequestChart.data.labels.push(time);

  totalRequestChart.data.datasets.forEach((dataset) => {
    dataset.data.push(data.total_requests);
  });

  totalRequestChart.update();
  // get the total requests label
  const totalRequetsElement = $('#total-requests');
  // update the total requests label
  totalRequetsElement.text(data.total_requests);
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
        tension: 0.1,
        pointRadius: 0,
        fill: true, // Enable area fill
        backgroundColor: 'rgba(244, 67, 54, 0.2)', // Light red area color
        borderColor: '#f44336', // Line color
      },
      {
        label: 'Memory Usage',
        data: [],
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
      x: {
        grid: {
          display: true, // Display grid lines
          color: '#ffffff33', // Grid line color
          borderColor: '#ffffff33', // Border color
          borderWidth: 2, // Border width
          drawBorder: true, // Draw border around the chart
          drawOnChartArea: true, // Draw grid lines in the chart area
          drawTicks: true, // Draw ticks on the scale
          tickColor: '#ffffff33', // Tick color
          tickLength: 10, // Tick length
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true, // Display grid lines
          color: '#ffffff33', // Grid line color
          borderColor: '#ffffff33', // Border color
          borderWidth: 2, // Border width
          drawBorder: true, // Draw border around the chart
          drawOnChartArea: true, // Draw grid lines in the chart area
          drawTicks: true, // Draw ticks on the scale
          tickColor: '#ffffff33', // Tick color
          tickLength: 10, // Tick length
        },
      },
    },
    elements: {
      line: {
        borderWidth: 0.5,
      },
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: 'min-max', // or 'lttb'
        samples: 500, // Number of points to keep
      },
    },
  },
});

// global variables for selected node and service
let selected_node = null;
let selected_service = null;

function setSelectedNode() {
  const nodes_ = $('.node');
  // remove the selected class from all the nodes
  nodes_.removeClass('node__selected');
  const node = $(this);
  node.addClass('node__selected');

  // get the service id and instance id from the node id
  const node_id = node.attr('id'); // node-1-1
  const [_, service_id, instance_id] = node_id.split('-');
  selected_node = parseInt(instance_id);
  selected_service = parseInt(service_id);

  // show the instance graph
  const instanceResourceCardElement = $('#instance-resource-card');
  instanceResourceCardElement.show();
  // set the node name as the selected node
  const nodeNameElement = instanceResourceCardElement.find('.chart-header h2');
  if (nodeNameElement) {
    nodeNameElement.text(`Node ${service_id}.${instance_id}`);
  }

  // clean the node resource usage chart data
  instancesChart.data.labels = [];
  instancesChart.data.datasets[0].data = [];
}
// event listeners
const nodes = $('.node');
nodes.each(function (index, node) {
  $(node).click(setSelectedNode);
});

function addNewInstance(data) {
  // create a new node element
  const node = $(
    `<div class='node' id='node-${data.service_id}-${data.instance.id}' ></div>`,
  );
  // create a title bar element for the node
  const titleBar = $("<div class='node__title__bar'></div>");
  // add instance id and status as a h2 and span to the title bar
  titleBar.append(`<h2>Node ${data.service_id}.${data.instance.id}</h2>`);
  titleBar.append(`<span class='node-status'>UP</span>`);

  // create a service name, ip address and port element
  const serviceElement = $(`<p class='node__service'>${data.service_name}</p>`);
  const table = $('<table></table>');
  const ipRow = $('<tr></tr>');
  ipRow.append(`<td class='left-td' >IP Address</td>`);
  ipRow.append(`<td>${data.instance.ip_address}</td>`);
  const portRow = $('<tr></tr>');
  portRow.append(`<td class='left-td' >Port:</td>`);
  portRow.append(`<td>${data.instance.port}</td>`);
  table.append(ipRow);
  table.append(portRow);

  // insert a ul element
  const ul = $('<ul></ul>');
  // create a table element
  const infoTable = $('<table></table>');
  // create a row for CPU
  const cpuRow = $('<tr></tr>');
  cpuRow.append("<td class='left-td' >CPU Usage</td>");
  cpuRow.append('<td><span class="cpu">0%</span></td>');
  // create a row for Memory
  const memRow = $('<tr></tr>');
  memRow.append("<td class='left-td' >Memory Usage</td>");
  memRow.append('<td><span class="mem">0%</span></td>');
  // create a row for Uptime
  const uptimeRow = $('<tr></tr>');
  uptimeRow.append("<td class='left-td' >Uptime</td>");
  uptimeRow.append('<td><span class="uptime">0s</span></td>');
  // append all rows to the table
  infoTable.append(cpuRow);
  infoTable.append(memRow);
  infoTable.append(uptimeRow);
  // append the table to the ul element
  ul.append($('<li></li>').append(table));
  // insert all the element to the node element
  node.append(titleBar);
  node.append(serviceElement);
  node.append(table);
  node.append(infoTable);

  // add event listeners
  node.click(setSelectedNode);

  // add node to the node grid
  $(`.nodes-grid`).append(node);

  // get the total instances element
  const totalInstancesElement = $('#total_instances');
  if (totalInstancesElement) {
    // get its text and converted to a number
    let totalInstances = parseInt(totalInstancesElement.text());
    totalInstancesElement.text(totalInstances + 1);
  }

  // hide the no instances element
  hideNoInstances();

  // update the number of instances and up instances of the service
  updateInstanceCount(data.service_id, 1);
  updateUpInstanceCount(data.service_id, 1);
}

function updateHealth(data) {
  // get the node element with service id and instance id received from the server
  const node = $(`#node-${data.service_id}-${data.instance_id}`);
  if (node.length) {
    // update the health status and data of the node
    node
      .find('.cpu')
      .text(
        data.health.cpu_usage[data.health.cpu_usage.length - 1].usage.toFixed(
          2,
        ) + '%',
      );
    node.find('.mem').text(data.health.memory_usage.usage.toFixed(2) + '%');
    node.find('.uptime').text(data.health.uptime.toFixed(2) + 's');
  }

  if (
    data.service_id === selected_service &&
    data.instance_id === selected_node
  ) {
    // push the data to the instances chart
    const chart = instancesChart;
    const time = new Date().toLocaleTimeString();
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(data.health.cpu_usage[0].usage.toFixed(2));
    chart.data.datasets[1].data.push(data.health.memory_usage.usage.toFixed(2));
    chart.update();
  }
}

// chart for the incoming data to the API gateway
const dataInCanvas = document.getElementById('data-in-chart').getContext('2d');
const dataInChart = new Chart(dataInCanvas, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Data In',
        data: [],
        tension: 0.1,
        pointRadius: 0,
        fill: true, // Enable area fill
        backgroundColor: '#4CAF50', // Light green area color
        borderColor: '#4CAF50', // Line color
      },
    ],
  },
  options: {
    scales: {
      x: {
        grid: {
          display: true, // Display grid lines
          color: '#ffffff33', // Grid line color
          borderColor: '#ffffff33', // Border color
          borderWidth: 2, // Border width
          drawBorder: true, // Draw border around the chart
          drawOnChartArea: true, // Draw grid lines in the chart area
          drawTicks: true, // Draw ticks on the scale
          tickColor: '#ffffff33', // Tick color
          tickLength: 10, // Tick length
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true, // Display grid lines
          color: '#ffffff33', // Grid line color
          borderColor: '#ffffff33', // Border color
          borderWidth: 2, // Border width
          drawBorder: true, // Draw border around the chart
          drawOnChartArea: true, // Draw grid lines in the chart area
          drawTicks: true, // Draw ticks on the scale
          tickColor: '#ffffff33', // Tick color
          tickLength: 10, // Tick length
        },
        ticks: {
          callback: function (value) {
            return (value / 1024).toFixed(2) + ' KB';
          },
        },
      },
    },
    elements: {
      line: {
        borderWidth: 0.5,
      },
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: 'min-max', // or 'lttb'
        samples: 500, // Number of points to keep
      },
    },
  },
});

// chart for the outgoing data from the API gateway
const dataOutCanvas = document
  .getElementById('data-out-chart')
  .getContext('2d');
const dataOutChart = new Chart(dataOutCanvas, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Data Out',
        data: [],
        tension: 0.1,
        pointRadius: 0,
        fill: true, // Enable area fill
        backgroundColor: '#FF5722', // Light orange area color
        borderColor: '#FF5722', // Line color
      },
    ],
  },
  options: {
    scales: {
      x: {
        grid: {
          display: true, // Display grid lines
          color: '#ffffff33', // Grid line color
          borderColor: '#ffffff33', // Border color
          borderWidth: 2, // Border width
          drawBorder: true, // Draw border around the chart
          drawOnChartArea: true, // Draw grid lines in the chart area
          drawTicks: true, // Draw ticks on the scale
          tickColor: '#ffffff33', // Tick color
          tickLength: 10, // Tick length
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true, // Display grid lines
          color: '#ffffff33', // Grid line color
          borderColor: '#ffffff33', // Border color
          borderWidth: 2, // Border width
          drawBorder: true, // Draw border around the chart
          drawOnChartArea: true, // Draw grid lines in the chart area
          drawTicks: true, // Draw ticks on the scale
          tickColor: '#ffffff33', // Tick color
          tickLength: 10, // Tick length
        },
        ticks: {
          callback: function (value) {
            return (value / 1024).toFixed(2) + ' KB';
          },
        },
      },
    },
    elements: {
      line: {
        borderWidth: 0.5,
      },
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: 'min-max', // or 'lttb'
        samples: 500, // Number of points to keep
      },
    },
  },
});

// function for update the data in and out chart
function handleDataInOut(data) {
  // get the current time
  const time = new Date().toLocaleTimeString();
  // push the data to the data in chart
  dataInChart.data.labels.push(time);
  dataInChart.data.datasets[0].data.push(data.total.in);
  dataInChart.update();
  // push the data to the data out chart
  dataOutChart.data.labels.push(time);
  dataOutChart.data.datasets[0].data.push(data.total.out);
  dataOutChart.update();
}
