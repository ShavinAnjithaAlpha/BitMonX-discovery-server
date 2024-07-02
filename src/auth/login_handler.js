const crypto = require('crypto');
const ejs = require('ejs');
const path = require('path');
// demo only
const USERNAME = 'admin';
const PASSWORD = 'admin';

const sessions = {};

/**
 * Handles the login request.
 * @param {Request} req - The request object.
 */
function handleLogin(req, res) {
  // get the username and the password from the request body
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
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

/**
 * Authenticates the user.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {Function} next - The next function.
 */
function authenticate(req, res, next) {
  const { cookie } = req.headers;
  const session = cookie && cookie.split(';')[1];
  const sessionId = session && session.trim().split('=')[1];

  if (sessionId && sessions[sessionId]) {
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

module.exports = {
  handleLogin,
  renderLogin,
  authenticate,
};
