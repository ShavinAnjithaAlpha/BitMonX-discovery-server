const { discovery } = require('../src/index');
const Logger = require('../src/logger');

const logger = new Logger();
logger.level('debug');
discovery(logger);
