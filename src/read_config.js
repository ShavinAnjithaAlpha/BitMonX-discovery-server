const fs = require('node:fs');

function read_config() {
  // get the current working directory
  const cwd = process.cwd();

  // read the config file
  // look for config file in the current working directory
  const config_file = 'config.json';
  const config_path = `${cwd}/${config_file}`;
  if (!fs.existsSync(config_path)) {
    console.error(`Config file not found: ${config_path}`);
    process.exit(1);
  }

  // read the config file
  const config = fs.readFileSync(config_path, 'utf8');
  return JSON.parse(config);
}

// read the configurations and export the configurations
module.exports = read_config();
