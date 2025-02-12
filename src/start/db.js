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

const sqlite = require('sqlite3').verbose();
const fs = require('fs');
const { hashPassword } = require('../auth/password');
const Logger = require('../logger');

const DB_NAME = 'discovery.db';

function getDatabase() {
  // get the current working directory
  const cwd = process.cwd();
  // sqlite3 database file name
  // database file path
  const db_path = `${cwd}/${DB_NAME}`;

  // create a new database
  const db = new sqlite.Database(db_path, (err) => {
    if (err) {
      Logger.logger().error('[bitmonx] Error creating database: ', err);
      process.exit(1);
    }
  });

  return db;
}

function init() {
  // chekc if the database file is already crated
  const db_path = `${process.cwd()}/discovery.db`;
  if (fs.existsSync(db_path)) {
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
