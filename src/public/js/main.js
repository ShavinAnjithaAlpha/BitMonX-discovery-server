const ws = new WebSocket('ws://localhost:8765');

ws.onopen = function () {
  console.log('WebSocket connection established');
  ws.send('Hello Server!');
};

ws.onmessage = function (event) {
  console.log('Message from server:', JSON.parse(event.data));
};

ws.onclose = function () {
  console.log('WebSocket connection closed');
};

ws.onerror = function (error) {
  console.error('WebSocket error:', error);
};
