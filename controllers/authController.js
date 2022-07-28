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
} = require("../utils");

const User = require("../models/User");
const Token = require("../models/Token");

const useragent = require("express-useragent");
const crypto = require("crypto");

// regex check if there are any tag
const tagRegex = /<.*>/g;

const register = async (req, res) => {
	const { username, password, email } = req.body;

	if (username.length < 3 || username.length > 20) {
		throw new CustomError.BadRequestError(
			"The username must have from 3 to 20 characters"
		);
	}

	// prevent SQL injection
	if (username.match(/^[A-Za-z0-9_-]*$/)) {
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
			"The password must have at least 8 characters, has at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character"
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
		interested,
	} = req.body;
	if (!verificationToken) {
		throw new CustomError.UnauthenticatedError("Cannot verify user");
	}

	let decoded;
	try {
		decoded = isTokenValid(verificationToken, process.env.VERIFICATION_SECRET);
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
			"Verification token is expired after 10 minutes"
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

	const cloudinaryRegex = /^https:\/\/res.cloudinary.com\/$/;
	if (!images || images.length < 1) {
		throw new CustomError.BadRequestError("There must be at least 1 image");
	}
	for (image of images) {
		if (!image.match(cloudinaryRegex)) {
			throw new CustomError.BadRequestError(
				"The image link must be valid and uploaded to Cloudinary"
			);
		}
	}

	if (!age || age < 18) {
		throw new CustomError.BadRequestError("The age must be at least 18");
	}

	if (gender !== "Male" && gender !== "Female" && gender !== "Other") {
		throw new CustomError.BadRequestError("Not a supported gender");
	}

	if (
		location !== "HCM City" &&
		location !== "Hanoi" &&
		location !== "Danang"
	) {
		throw new CustomError.BadRequestError("Not a supported location");
	}

	if (!hobbies || hobbies.length < 3) {
		throw new CustomError.BadRequestError("There must be at least 3 hobbies");
	}
	for (hobby of hobbies) {
		if (hobby.length < 3 || hobby.length > 20 || hobby.match(tagRegex)) {
			throw new CustomError.BadRequestError(
				"Each hobby must have from 3 to 20 characters and does not have any tag"
			);
		}
	}

	if (!biography || biography.length > 100 || biography.match(tagRegex)) {
		throw new CustomError.BadRequestError(
			"The biography must have less than 100 characters and does not have any tag"
		);
	}

	if (school !== "SSET" && school !== "SCD" && school !== "SBM") {
		throw new CustomError.BadRequestError("Not a supported school");
	}

	const {
		interestedGender,
		interestedMinAge,
		interestedMaxAge,
		interestedLocation,
		interestedHobbies,
	} = interested;

	if (!interestedGender) {
		if (gender === "Male") {
			interested.interestedGender = "Female";
		} else if (gender === "Female") {
			interested.interestedGender = "Male";
		}
	}

	if (
		interestedGender !== "Male" &&
		interestedGender !== "Female" &&
		interestedGender !== "Other"
	) {
		throw new CustomError.BadRequestError("Not a supported interested gender");
	}

	if (
		interestedMinAge &&
		interestedMaxAge &&
		interestedMinAge > interestedMaxAge
	) {
		throw new CustomError.BadRequestError(
			"Min age must be smaller than max age"
		);
	}

	if (interestedLocation) {
		if (
			interestedLocation !== "HCM City" &&
			interestedLocation !== "Hanoi" &&
			interestedLocation !== "Danang"
		) {
			throw new CustomError.BadRequestError(
				"Not a supported interested location"
			);
		}
	}

	if (interestedHobbies) {
		for (hobby of interestedHobbies) {
			if (hobby.length < 3 || hobby.length > 20 || hobby.match(tagRegex)) {
				throw new CustomError.BadRequestError(
					"Each interested hobby must have from 3 to 20 characters and does not have any tag"
				);
			}
		}
	}

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
		throw new CustomError.BadRequestError("Please provide email and password");
	}

	const user = await User.findOne({ email });
	if (!user) {
		throw new CustomError.UnauthenticatedError("Invalid Credentials");
	}

	const isPasswordCorrect = await user.comparePassword(password);
	if (!isPasswordCorrect) {
		throw new CustomError.UnauthenticatedError("Invalid Credentials");
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
		throw new CustomError.BadRequestError("This email does not exist");
	}

	const { username, role, password } = user;

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
	await sendResetPasswordEmail(
		req.useragent.browser,
		email,
		verificationToken,
		origin
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
		decoded = isTokenValid(verificationToken, process.env.VERIFICATION_SECRET);
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
		throw new CustomError.BadRequestError("This email does not exist");
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
