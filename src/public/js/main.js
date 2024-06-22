const ws = new WebSocket('ws://localhost:8765');

ws.onopen = function () {
  console.log('WebSocket connection established');
  ws.send('Hello Server!');
};

ws.onmessage = function (event) {
  updateHealth(JSON.parse(event.data));
};

ws.onclose = function () {
  console.log('WebSocket connection closed');
};

ws.onerror = function (error) {
  console.error('WebSocket error:', error);
};

function updateHealth(data) {
  const healthCards = document.querySelectorAll('.health-card');
  healthCards.forEach((card) => {
    // get the inside p element of the card
    const cpu_p = card.querySelector('.health-card__cpu');
    const memory_p = card.querySelector('.health-card__memory');
    const uptime_p = card.querySelector('.health-card__uptime');

    // set the updated values of the card
    cpu_p.textContent = data.cpu_usage.user;
    memory_p.textContent = data.memory_usage.rss;
    uptime_p.textContent = data.uptime;
  });
}
