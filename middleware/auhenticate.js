const jwt = require('jsonwebtoken');
const config = require('config');

//jwt token based verification to authenticate a Valid user, Header, payload and verify signature
function authenticate(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).send('Access denied. No token provided.');
  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    next();
  } catch (ex) {
    res.status(400).send('Invalid token...');
  }
}

module.exports = authenticate;
