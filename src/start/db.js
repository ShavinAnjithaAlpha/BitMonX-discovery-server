const sqlite = require('sqlite3').verbose();
const fs = require('fs');
const { hashPassword } = require('../auth/password');

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
  // chekc if the database file is already crated
  const db_path = `${process.cwd()}/discovery.db`;
  if (fs.existsSync(db_path)) {
    console.log('[DATABASE]: database already exists');
    return;
  }

  // first create the database
  const db = getDatabase();

  // now create the schema of the database
  db.serialize(() => {
    // create the table for string services
    db.run(`DROP TABLE IF EXISTS admin`);
    db.run(`CREATE TABLE admin(
            id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(1024) NOT NULL,
            role VARCHAR(255) NOT NULL
            )`);

    // create a admin user for the admin panel
    const username = 'admin';
    const password = 'bitmonx';
    const email = 'admin@bitmonx.com';
    // hashed the passowrd
    const hashedPassword = hashPassword(password);
    // insert the user into the database
    const insertQuery = `INSERT INTO admin(username, email, password, role) VALUES(?, ?, ?, ?)`;
    db.run(insertQuery, [username, email, hashedPassword, 'admin']);
  });
}

module.exports = {
  getDatabase,
  init,
};
