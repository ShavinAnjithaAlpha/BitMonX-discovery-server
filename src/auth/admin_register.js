const { authenticate } = require('./login_handler');
const ejs = require('ejs');
const path = require('path');

function handleRegistration(req, res) {}

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
