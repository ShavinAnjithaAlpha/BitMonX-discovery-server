/* 
  This class is used to store the health of the registry.
*/
class Health {
  // properties
  cpu_usage = 0;
  mem_usage = 0;
  disk_usage = 0;

  constructor() {
    // empty constructor
    return this;
  }

  // getters
  getCpuUsage() {
    return this.cpu_usage;
  }

  getMemUsage() {
    return this.mem_usage;
  }

  // setters
  setCpuUsage(cpu_usage) {
    this.cpu_usage = cpu_usage;
    return this;
  }

  setMemUsage(mem_usage) {
    this.mem_usage = mem_usage;
    return this;
  }

  static builder() {
    return new Health();
  }

  build() {
    return this;
  }
}

module.exports = Health;
