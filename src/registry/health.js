/**
 * MIT License
 *
 * Copyright (c) 2024 Shavin Anjitha Chandrawansha
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

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
