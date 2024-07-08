module.exports = {
  server: {
    port: 8765,
  },
  loadbalancer: {
    algorithm: 'round-robin',
  },
  health_check_interval: 5000,
  api_stat_send_interval: 5000,
};
