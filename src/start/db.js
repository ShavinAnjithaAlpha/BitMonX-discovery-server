const sqlite = require('sqlite3').verbose();

function getDatabase() {
  // get the current working directory
  const cwd = process.cwd();
  // sqlite3 database file name
  const db_name = 'discovery.db';
  // database file path
  const db_path = `${cwd}/${db_name}`;

  // create a new database
  const db = new sqlite.Database(db_path, (err) => {
    if (err) {
      console.error('Error creating database: ', err.message);
      process.exit(1);
    }

    // otherwise print the success message
    console.log(`[DATABASE]: database connected`);
  });

  return db;
}

function init() {
  // first create the database
  const db = getDatabase();

  // now create the schema of the database
  db.serialize(() => {
    // create the table for string services
    db.run(`DROP TABLE IF EXISTS service`);
    db.run(`CREATE TABLE service(
            id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
            name VARCHAR(255) NOT NULL,
            mapping VARCHAR(255) NOT NULL,
            protocol VARCHAR(255) NOT NULL,
            health_check_url VARCHAR(512) NOT NULL,
            health_check_interval INTEGER NOT NULL,
            timeout INTEGER NOT NULL
            )`);

    db.run(`DROP TABLE IF EXISTS instance`);
    db.run(`CREATE TABLE instance(
              id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
              service_id INTEGER NOT NULL,
              url VARCHAR(512) NOT NULL,
              port INTEGER NOT NULL
              )`);
  });
}

module.exports = {
  getDatabase,
  init,
};
