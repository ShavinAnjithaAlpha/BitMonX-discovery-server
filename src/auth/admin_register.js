const { authenticate } = require('./login_handler');
const ejs = require('ejs');
const path = require('path');
const { getDatabase } = require('../start/db');
const { hashPassword } = require('./password');

/*
 * Handles the registration of a new admin user.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the registration is done.
 * @throws {Error} - If an error occurs.
 * @throws {Error} - If the username, email or password are not provided.
 * @throws {Error} - If the user already exists.
 * @throws {Error} - If an error occurs while saving the admin.
 */
async function handleRegistration(req, res) {
  // check if the username and password are privided through the request body
  if (!req.body.username || !req.body.password || !req.body.email) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Username, email and password are required');
    return;
  }

  // check if the user already exists
  const exists = await userExists(req.body.username, req.body.email);
  if (exists) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('User already exists');
    return;
  }

  // else save the admin in the db
  saveAdmin(req.body.username, req.body.email, hashPassword(req.body.password));
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Admin registered successfully');
}

/*
 * Check if a user with the given username or email already exists in the database.
 * @param {String} username - The username to check.
 * @param {String} email - The email to check.
 * @returns {Promise<Boolean>} - True if the user exists, false otherwise.
 */
function userExists(username, email) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const query = `SELECT * FROM admin WHERE username = ? OR email = ?`;
    db.all(query, [username, email], (err, rows) => {
      db.close();

      if (err) {
        reject(new Error('Error checking user'));
      } else {
        resolve(rows.length > 0);
      }
    });
  });
}

/*
 * Save the admin user to the database.
 * @param {String} username - The username of the admin.
 * @param {String} email - The email of the admin.
 * @param {String} password - The password of the admin.
 * @returns {Promise<void>} - A promise that resolves when the admin is saved.
 */
function saveAdmin(username, email, password) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const query = `INSERT INTO admin(username, email, password, role) VALUES(?, ?, ?, ?)`;
    db.run(query, [username, email, password, 'admin'], (err) => {
      db.close();

      if (err) {
        reject(new Error('Error saving admin'));
      } else {
        resolve();
      }
    });
  });
}

/*
 * Renders the registration page.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
function renderRegistration(req, res) {
  authenticate(req, res, () => {
    // path to the registration template file
    const template = path.join(__dirname, '../views', 'register.ejs');

    ejs.renderFile(template, {}, {}, (err, str) => {
      if (err) {
        console.log(err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('An error occurred');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(str);
    });
  });
}

module.exports = {
  handleRegistration,
  renderRegistration,
};
