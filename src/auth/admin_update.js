const path = require('path');
const ejs = require('ejs');
const { getDatabase } = require('../start/db');
const { authenticate } = require('./login_handler');
const { hashPassword } = require('./password');

/*
 * Handles the update of an admin user.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
async function handleUpdateAdmin(req, res) {
  authenticate(req, res, async () => {
    // get the username from the request
    const username = req.username;

    // check if the username, email and new password are provided through the request body
    if (!req.body.username || !req.body.email || !req.body.password) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Username, email and password are required');
      return;
    }

    await updateAdmin(username, req.body);

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Admin updated successfully');
  });
}

/*
 * Check if a user with the given username or email already exists in the database.
 * @param {String} username - The username to check.
 * @param {String} email - The email to check.
 * @returns {Promise<Boolean>} - True if the user exists, false otherwise.
 */
function updateAdmin(username, data) {
  return new Promise((resolve, reject) => {
    // first hashed the password
    const hashedPassword = hashPassword(data.password);
    const db = getDatabase();
    const query = `UPDATE admin SET username = ?, email = ?, password = ? WHERE username = ?`;
    db.run(
      query,
      [data.username, data.email, hashedPassword, username],
      (err) => {
        db.close();

        if (err) {
          reject(new Error('Error updating admin'));
        } else {
          resolve();
        }
      },
    );
  });
}

async function renderUpdateAdmin(req, res) {
  authenticate(req, res, async () => {
    // ge the admin account details
    const account = await getAdminAccount(req.username);
    const data = {
      username: account.username,
      email: account.email,
    };
    // path to the registration template file
    const template = path.join(__dirname, '../views', 'update.ejs');

    ejs.renderFile(template, { account: data }, {}, (err, str) => {
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

/*
 * Get the admin account from the database.
 * @param {String} username - The username of the admin.
 * @returns {Promise<Object>} - The admin object.
 */
function getAdminAccount(username) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const query = `SELECT * FROM admin WHERE username = ?`;
    db.get(query, [username], (err, row) => {
      db.close();

      if (err) {
        reject(new Error('Error getting admin account'));
      } else {
        resolve(row);
      }
    });
  });
}

module.exports = {
  handleUpdateAdmin,
  renderUpdateAdmin,
};
