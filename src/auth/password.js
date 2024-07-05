const crypto = require('crypto');

/**
 * Hashes the given password.
 * @param {string} password - The password to hash.
 * @returns {string} - The hashed password.
 */
function hashPassword(password) {
  // use the sha256 algorithm to hash the password
  const hash = crypto.createHash('sha256');
  hash.update(password);
  // return the hased passowrd as a hex string
  return hash.digest('hex');
}

/**
 * Checks if the given password matches the hash.
 * @param {string} password - The password to check.
 * @param {string} hash - The hash to compare.
 * @returns {boolean} - True if the password matches the hash, false otherwise.
 */
function checkPassword(password, hash) {
  return hashPassword(password) === hash;
}

module.exports = {
  hashPassword,
  checkPassword,
};
