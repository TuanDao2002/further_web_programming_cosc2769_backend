const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
    isTokenValid,
    makeVerificationToken,
    checkRole,
    sendVerificationEmail,
    createTokenUser,
    attachCookiesToResponse,
    sendResetPasswordEmail,
    validateRequiredProfileInput,
} = require("../utils");

const User = require("../models/User");
const Token = require("../models/Token");

const useragent = require("express-useragent");
const crypto = require("crypto");

const normalCharRegex = /^[A-Za-z0-9._-]*$/;

const register = async (req, res) => {
    const { username, password, email } = req.body;

    if (username.length < 1 || username.length > 22) {
        throw new CustomError.BadRequestError(
            "The username must have from 1 to 22 characters"
        );
    }

    // prevent SQL injection
    if (!username.match(normalCharRegex)) {
        throw new CustomError.BadRequestError(
            "The username must not have strange characters"
        );
    }

    // check if the password has at least 8 characters, has at least 1 uppercase, 1 lowercase, 1 digit, 1 special character
    if (
        !password.match(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*].{8,}$/
        )
    ) {
        throw new CustomError.BadRequestError(
            "The password must have at least 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character"
        );
    }

    const role = checkRole(email);

    const findEmail = await User.findOne({ email });
    if (findEmail) {
        throw new CustomError.BadRequestError("This email already exists");
    }

    const minutesToExpire = 60;
    const verificationToken = makeVerificationToken(
        username,
        email,
        role,
        password,
        process.env.VERIFICATION_SECRET,
        minutesToExpire
    );

    const origin =
        process.env.NODE_ENV === "dev"
            ? "http://localhost:3000"
            : process.env.REACT_APP_LINK; // later this is the origin link of React client side
    await sendVerificationEmail(
        req.useragent.browser,
        email,
        verificationToken,
        origin,
        minutesToExpire
    );

    res.status(StatusCodes.CREATED).json({
        role,
        msg: "Please check your email to verify your account!",
    });
};

const createProfile = async (req, res) => {
    const {
        verificationToken,
        images,
        age,
        gender,
        location,
        hobbies,
        biography,
        school,
    } = req.body;
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
            "Verification token is expired after 60 minutes"
        );
    }

    const findEmail = await User.findOne({ email });
    if (findEmail) {
        throw new CustomError.BadRequestError("This email already exists");
    }

    if (checkRole(email) === "admin") {
        await User.create({
            username: "admin",
            email,
            role,
            password,
        });

        res.status(StatusCodes.OK).json({
            msg: `Admin account is created!`,
        });

        return;
    }

    validateRequiredProfileInput(
        images,
        age,
        gender,
        location,
        hobbies,
        school
    );

    if (biography === undefined || biography.length > 500) {
        throw new CustomError.BadRequestError(
            "Biography must be defined and less than 500 characters"
        );
    }

    let interestedGender;
    if (gender === "Male") {
        interestedGender = "Female";
    } else if (gender === "Female") {
        interestedGender = "Male";
    } else {
        interestedGender = "Other";
    }

    const interested = {
        interestedGender,
        interestedMinAge: age <= 23 ? 18 : age - 5,
        interestedMaxAge: age + 5,
        interestedLocations: [location],
    };

    await User.create({
        username,
        email,
        role,
        password,
        images,
        age,
        gender,
        location,
        hobbies,
        biography,
        school,
        interested,
    });

    res.status(StatusCodes.OK).json({
        msg: `Profile with username: ${username} is created!`,
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new CustomError.BadRequestError(
            "Please provide email and password"
        );
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new CustomError.UnauthenticatedError(
            "Email or password is not matched"
        );
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new CustomError.UnauthenticatedError(
            "Email or password is not matched"
        );
    }

    const tokenUser = createTokenUser(user);

    // create refresh token
    let refreshToken = "";
    // check for existing token
    const existingToken = await Token.findOne({ user: user._id });

    if (existingToken) {
        refreshToken = existingToken.refreshToken;
        attachCookiesToResponse({ res, user: tokenUser, refreshToken });
        res.status(StatusCodes.OK).json({ user: tokenUser });
        return;
    }

    refreshToken = crypto.randomBytes(40).toString("hex");
    const userAgent = req.headers["user-agent"];
    const ip = req.ip;
    const userToken = { refreshToken, ip, userAgent, user: user._id };

    await Token.create(userToken);

    attachCookiesToResponse({ res, user: tokenUser, refreshToken });

    res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
    await Token.findOneAndDelete({ user: req.user.userId });

    res.cookie("accessToken", "logout", {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.cookie("refreshToken", "logout", {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.status(StatusCodes.OK).json({ msg: "Logged out!" });
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new CustomError.BadRequestError("Please provide a valid email");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new CustomError.NotFoundError("This email does not exist");
    }

    const { username, role, password } = user;

    const minutesToExpire = 10;
    const verificationToken = makeVerificationToken(
        username,
        email,
        role,
        password,
        process.env.VERIFICATION_SECRET,
        minutesToExpire
    );

    const origin =
        process.env.NODE_ENV === "dev"
            ? "http://localhost:3000"
            : process.env.REACT_APP_LINK; // later this is the origin link of React client side
    await sendResetPasswordEmail(
        req.useragent.browser,
        email,
        verificationToken,
        origin,
        minutesToExpire
    );

    res.status(StatusCodes.CREATED).json({
        msg: "Please check your email to reset your password!",
    });
};

const resetPassword = async (req, res) => {
    const { verificationToken, newPassword } = req.body;

    if (!verificationToken) {
        throw new CustomError.UnauthenticatedError("Cannot verify user");
    }

    // check if the password has at least 8 characters, has at least 1 uppercase, 1 lowercase, 1 digit, 1 special character
    if (
        !newPassword.match(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*].{8,}$/
        )
    ) {
        throw new CustomError.BadRequestError(
            "The password must have at least 8 characters, has at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character"
        );
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

    const { email, expirationDate } = decoded;
    const now = new Date();

    if (new Date(expirationDate).getTime() <= now.getTime()) {
        throw new CustomError.UnauthenticatedError(
            "Verification token is expired after 10 minutes"
        );
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new CustomError.NotFoundError("This email does not exist");
    }

    user.password = newPassword;
    await user.save();

    res.status(StatusCodes.OK).json({
        msg: "Your password is reset successfully!",
    });
};

module.exports = {
    register,
    createProfile,
    login,
    logout,
    forgotPassword,
    resetPassword,
};
