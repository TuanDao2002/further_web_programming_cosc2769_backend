const CustomError = require("../errors");
const { verifyToken } = require("../utils");

const authenticateUser = async (req, res, next) => {
    const { refreshToken, accessToken } = req.cookies;
    verifyToken(refreshToken, accessToken, req, res, next)
};

const authorizePermissions = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new CustomError.UnauthorizedError(
                "Unauthorized to access this route"
            );
        }
        next();
    };
};

module.exports = {
    authenticateUser,
    authorizePermissions,
};
