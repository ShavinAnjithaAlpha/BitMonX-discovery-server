/**
 * This module contains the functions to delete an admin from the database
 * @module src/auth/admin_delete
 * @requires sqlite3
 * @requires src/start/db
 *
 */

const { getDatabase } = require('../start/db');
const { authenticate, removeUserFromSessions } = require('./login_handler');

/**
    This function handles the request to delete an admin
    @param {Object} req - the request object
    @param {Object} res - the response object
 */
async function deleteAdminHandler(req, res) {
  authenticate(req, res, async () => {
    // get the username through auth middleware
    const username = req.username;
    // get the admin username to delete
    try {
      await deleteAdmin(username);
      // remove the session Id from the sessions object
      removeUserFromSessions(username);
      // redirect to the login page
      res.writeHead(302, { Location: '/bitmonx/login' });
      res.end();
    } catch (err) {
      // if there is an error, return a 500 error
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error deleting the admin: ' + err.message);
      return;
    }
  });
}

/**
    This function deletes an admin from the database
    @param {string} username - the username of the admin to delete
    @returns {Promise} - the result of the query
**/
function deleteAdmin(username) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();

    const query = 'DELETE FROM admin WHERE username = ?';
    db.run(query, [username], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  deleteAdminHandler,
};
