module.exports = class IDGenerator {
  /**
   * This class is responsible for generating uniqe IDS for the registry entries especially for instance
   * that is used to identify instances across services over local instance id under service namespace.
   * Generated uniqe id is starts with a prefix that identified the each entries in the registry.
   * Ex: for instance --> i-drg4We7T
   *   for service   --> s-drg4We7T
   * ID is generated using the following pattern:
   * 1. 1-prefix character
   * 2. 32-bit timestamp + 8-bit process id + 24-bit random number --> in base64 encoding
   *
   * class maintaining hashmap to gurnatee the uniqe id generation for each prefix.
   * hashmap gor flushed after each minute to avoid memory leak
   * hashmap consisting of 1K entries
   * custom hashfunction is used to generate the hash of the key to store in hashmap
   **/

  INSTANCE_PREFIX = 'i';
  SERVICE_PREFIX = 's';
  PREFIX_DELIMITER = '-';

  static MAX_ITERATIONS = 1000;

  static HASHMAP_SIZE = 1024;
  static HASHMAP_FLUSHED_INTERVAL = 60 * 1000; // 1 minute
  hashmap;

  constructor() {
    this.hashmap = new Array(this.HASHMAP_SIZE);
    // initiate flushing hashmap
    this.flushingHashMap();
  }

  getNewInstanceID() {
    return this.getID(this.INSTANCE_PREFIX);
  }

  getNewServiceID() {
    return this.getID(this.SERVICE_PREFIX);
  }

  getID(prefix) {
    // generate ID until it is uniqe for the prefix
    for (let i = 0; i < IDGenerator.MAX_ITERATIONS; i++) {
      const id = this.generate();

      // get the hash and check against the hashmap
      const hash = IDGenerator.hash(prefix + this.PREFIX_DELIMITER + id);
      if (this.hashmap[hash] == undefined) {
        this.hashmap[hash] = id;
        return prefix + this.PREFIX_DELIMITER + id;
      }
    }
  }

  generate() {
    // get the timestamp-- 32 bit version
    const timestamp = Date.now() & 0xffffffff;
    // get the proces id of the curret process-- 8 bit portion
    const processId = process.pid & 0xff;
    // get 8-bit random bits
    const random = Math.floor(Math.random() * 0xffffff);
    // convert it to base64 encoding
    const buf = Buffer.alloc(10);
    buf.writeUInt32BE(timestamp, 0);
    buf.writeUInt8(processId, 4);
    buf.writeUInt32BE(random, 5);
    const code = buf.toString('base64');

    return code;
  }

  flushingHashMap() {
    // flush the hashmap after each minute
    setTimeout(() => {
      // clear the valueso of the hashmap
      this.hashmap = new Array(this.HASHMAP_SIZE);
    }, this.HASHMAP_FLUSHED_INTERVAL);
  }

  static hash(key) {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      const c = key[i];
      // get the ord value of the character
      const d = c.charCodeAt(0);
      h = (1_000_003 * h + d) % IDGenerator.HASHMAP_SIZE;
    }

    return h;
  }
};
