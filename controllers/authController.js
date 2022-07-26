const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
    isTokenValid,
    makeVerificationToken,
    checkRole,
    sendVerificationEmail,
    createTokenUser,
    attachCookiesToResponse,
} = require("../utils");

const User = require("../models/User");
const Token = require("../models/Token");

const useragent = require("express-useragent");

const register = async (req, res) => {
    const { username, password, email } = req.body;

    if (username.length < 3 || username.length > 20) {
        throw new CustomError.BadRequestError(
            "The username must have from 3 to 20 characters"
        );
    }

    const role = checkRole(email);

    const findEmail = await User.findOne({ email });
    if (findEmail) {
        throw new CustomError.BadRequestError("This email already exists");
    }

    const verificationToken = makeVerificationToken(
        username,
        email,
        role,
        password,
        process.env.VERIFICATION_SECRET
    );

    const origin =
        process.env.NODE_ENV === "dev"
            ? "http://localhost:3000"
            : process.env.REACT_APP_LINK; // later this is the origin link of React client side
    await sendVerificationEmail(
        req.useragent.browser,
        email,
        verificationToken,
        origin
    );

    res.status(StatusCodes.CREATED).json({
        msg: "Please check your email to verify your account!",
    });
};

const verifyEmail = async (req, res) => {
    const { verificationToken } = req.body;
    if (!verificationToken) {
        throw new CustomError.UnauthenticatedError("Cannot verify user");
    }

    let decoded;
    try {
        decoded = isTokenValid(
            verificationToken,
            process.env.VERIFICATION_SECRET
        );
    } catch {
        throw new CustomError.UnauthenticatedError("Verification Failed");
    }

    if (
        !decoded.hasOwnProperty("username") ||
        !decoded.hasOwnProperty("email") ||
        !decoded.hasOwnProperty("role") ||
        !decoded.hasOwnProperty("password") ||
        !decoded.hasOwnProperty("expirationDate")
    ) {
        throw new CustomError.UnauthenticatedError("Verification Failed");
    }

    const { username, email, role, password, expirationDate } = decoded;
    const now = new Date();

    if (new Date(expirationDate).getTime() <= now.getTime()) {
        throw new CustomError.UnauthenticatedError(
            "Verification token is expired after 2 minutes"
        );
    }

    let user;
    if (checkRole(email) === "admin") {
        user = await User.create({
            username: "admin",
            email,
            role,
            password,
        });
    } else {
        user = await User.create({
            username,
            email,
            role,
            password,
        });
    }

    const tokenUser = createTokenUser(user)
    // attachCookiesToResponse({res, user: tokenUser, refreshToken})

    res.status(StatusCodes.OK).json({
        msg: `Profile with username: ${user.username} is created!`,
    });
};

const createProfile = async (req, res) => {

};

module.exports = {
    register,
    verifyEmail,
};
