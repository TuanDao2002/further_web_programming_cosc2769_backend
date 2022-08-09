const { createJWT, isTokenValid } = require("./jwt");
const makeVerificationToken = require("./makeVerificationToken");
const checkRole = require("./checkRole");
const sendResetPasswordEmail = require("./sendResetPasswordEmail");
const sendVerificationEmail = require("./sendVerificationEmail");
const createTokenUser = require("./createTokenUser");
const verifyToken = require("./verifyToken");
const attachCookiesToResponse = require("./attachCookiesToResponse");
const validateRequiredProfileInput = require("./validateRequiredProfileInput");

module.exports = {
    createJWT,
    isTokenValid,
    makeVerificationToken,
    checkRole,
    sendResetPasswordEmail,
    sendVerificationEmail,
    createTokenUser,
    verifyToken,
    attachCookiesToResponse,
    validateRequiredProfileInput,
};
