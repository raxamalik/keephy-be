const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()
const HttpError = require('../utils/httpError')
module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    next()
  }
  const token = req.cookies.access_token
  console.log('Token:', req.cookies.access_token);

  if (!token) {
    return next(new HttpError('Authentication failed', 401))
  }
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decodedToken.userId
    req.email = decodedToken.email
    next()
  } catch (err) {
    console.log(err)
    return next(new HttpError('Authentication failed', 401))
  }
}
