const crypto = require('crypto');
const ejs = require('ejs');
const path = require('path');
const { getDatabase } = require('../start/db');
const { checkPassword } = require('./password');

const sessions = {};

/**
 * Handles the login request.
 * @param {Request} req - The request object.
 */
async function handleLogin(req, res) {
  // get the username and the password from the request body
  const { username, password } = req.body;
  let isValid = false;
  try {
    isValid = await checkCredentials(username, password);
  } catch (err) {
    throw new Error('Error checking credentials');
  }

  if (isValid) {
    // replace with the real cerdential checking
    // create a session Id
    const sessionId = generateSessionId();
    sessions[sessionId] = username;

    // write the coockie headers to the response
    res.writeHead(302, {
      'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Max-Age=3600; Path=/`,
      Location: '/bitmonx/dashboard',
    });
    res.end();
  } else {
    res.writeHead(403);
    res.end('Invalid username or password');
  }
}

async function checkCredentials(username, password) {
  // get the db connection
  const db = getDatabase();
  // query the database for the user
  const query = `SELECT * FROM admin WHERE username = ?`;
  return new Promise((resolve, reject) => {
    db.all(query, [username], (err, rows) => {
      db.close();

      if (err) {
        reject(new Error('Error checking credentials'));
      } else if (rows.length === 0) {
        resolve(false);
      } else {
        const user = rows[0];
        resolve(checkPassword(password, user.password));
      }
    });
  });
}

/**
 * Renders the login page.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
function renderLogin(req, res) {
  const templatePath = path.join(__dirname, '../views', 'login.ejs');
  ejs.renderFile(templatePath, {}, {}, (err, str) => {
    if (err) {
      res.writeHead(500);
      res.end('Internal server error');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(str);
    }
  });
}

/*
    This function is used to log out the user. It destroys the session and clears the session cookie.
    @param {Request} req - The request object.
    @param {Response} res - The response object.
*/
function logout(req, res) {
  // remove the session from the sessions object
  const session_data = getSessionValues(req);
  if (session_data && session_data.sessionId) {
    delete sessions[session_data.sessionId];
  }

  // redirect to login page again
  res.writeHead(302, { Location: '/bitmonx/login' });
  res.end('Logged out successfully');
}

/**
 * Authenticates the user.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {Function} next - The next function.
 */
function authenticate(req, res, next) {
  const session_data = getSessionValues(req);
  const sessionId = session_data && session_data.sessionId;

  if (sessionId && sessions[sessionId]) {
    req.username = sessions[sessionId];
    next();
  } else {
    res.writeHead(302, { Location: '/bitmonx/login' });
    res.end();
  }
}

/**
 * Generates a random token.
 * @param {number} length - Length of the token.
 * @returns {string} - The generated token.
 */
function generateSessionId() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Get the session values from the request.
 * @param {Request} req - The request object.
 * @returns {Object} - The session values.
 */
function getSessionValues(req) {
  const { cookie } = req.headers;
  // split the cookie string into an array of session strings
  const sessions_strs = cookie && cookie.split(';');
  if (!sessions_strs) return {};
  // convert the session data into a json object
  const session_data = {};
  sessions_strs.forEach((session) => {
    const [label, value] = session.trim().split('=');
    session_data[label] = value;
  });

  return session_data;
}

module.exports = {
  handleLogin,
  renderLogin,
  authenticate,
  logout,
};
