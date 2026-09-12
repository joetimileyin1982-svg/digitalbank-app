const jwt = require('jsonwebtoken');

/*middleware to verify token*/

const verifyToken = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, Token not found' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token not verified ' });
  }
};

module.exports = { verifyToken };
