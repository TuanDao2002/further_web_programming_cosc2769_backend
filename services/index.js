// Services layer responsible for business logic of the application
const AuthService = require('./auth/auth.service');
const JWTService = require('./auth/jwt.service');

module.exports = { AuthService, JWTService };