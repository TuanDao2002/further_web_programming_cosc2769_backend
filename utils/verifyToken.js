const CustomError = require("../errors");
const { isTokenValid } = require("./jwt");
const attachCookiesToResponse = require("./attachCookiesToResponse");
const Token = require("../models/Token");

const verifyToken = async (refreshToken, accessToken, req, res, next) => {
    try {
        if (accessToken) {
            const payload = isTokenValid(accessToken, process.env.JWT_SECRET);
            req.user = payload.user;
            return next();
        }
        const payload = isTokenValid(refreshToken, process.env.JWT_SECRET);

        const existingToken = await Token.findOne({
            user: payload.user.userId,
            refreshToken: payload.refreshToken,
        });

        if (!existingToken) {
            throw new CustomError.UnauthenticatedError(
                "Authentication Invalid"
            );
        }

        attachCookiesToResponse({
            res,
            user: payload.user,
            refreshToken: existingToken.refreshToken,
        });

        req.user = payload.user;
        next();
    } catch (error) {
        throw new CustomError.UnauthenticatedError("Authentication Invalid");
    }
};

module.exports = verifyToken;
