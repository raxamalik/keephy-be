const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/httpError');

const createToken = (options, next) => {
    let token;
    try {
        token = jwt.sign(options,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPRISE_IN });
    } catch (err) {
        console.log({ err });
        return next(new HttpError(err, 500));
    }

    return token;
};

module.exports = createToken;