const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const Swipe = require("../models/Swipe");
const User = require("../models/User");
const Room = require("../models/Room");

const swipeProfile = async (req, res) => {
	const {
		user: { userId },
		body: { profileId, like },
	} = req;

	// userId = "62f125e3c1a70f1d5060614d";
	// profileId = "62f1267fdba75b10b83ee18f";
	// like = true;

	const user = await User.findOne({ _id: userId });
	if (!user) {
		throw new CustomError.NotFoundError("Your account does not exist");
	}

	const profile = await User.findOne({ _id: profileId, role: "student" });
	if (!profile) {
		throw new CustomError.NotFoundError("This profile does not exist");
	}

	const duplicateSwipe = await Swipe.findOne({ from: userId, to: profileId });
	if (duplicateSwipe) {
		throw new CustomError.BadRequestError("You already swipe this profile");
	}

	const matchSwipe = await Swipe.findOne({
		from: profileId,
		to: userId,
		like: true,
	});

	if (matchSwipe && like) {
		// if 2 users already like each other, there is a match and a chat room will be created
		await Swipe.create({ from: userId, to: profileId, like });
		await Room.create({ participants: [userId, profileId] });
		res.status(StatusCodes.OK).json({
			msg: `You and ${profile.username} are matched`,
		});
		return;
	}

	await Swipe.create({ from: userId, to: profileId, like });
	res.status(StatusCodes.OK).json({
		msg: `You have swiped ${like ? "right" : "left"} ${profile.username}`,
	});
};

const getWhoLikeYou = async (req, res) => {
	let {
		user: { userId },
		query: { next_cursor },
	} = req;

	const user = await User.findOne({ _id: userId });
	if (!user) {
		throw new CustomError.NotFoundError("Your account does not exist");
	}

	// profiles you have swiped past already
	const swipedProfiles = await Swipe.find({ from: userId });
	const swipedProfileIds = swipedProfiles.map(
		(swipedProfile) => swipedProfile.to
	);

	let queryObject = {};
	// find users' profiles that like you
	queryObject.to = userId;
	queryObject.like = true;
	// not show profiles that you already swiped
	queryObject.from = { $nin: swipedProfileIds };

	let whoLikeYou = Swipe.find(queryObject).populate({
		path: "from",
		select: "-password -interested -email -role",
	});

	// return results sorted based on created time (profiles created first will be displayed first)
	whoLikeYou = whoLikeYou.sort("-createdAt -_id");
	const results = await whoLikeYou;

	res.status(StatusCodes.OK).json({ results, next_cursor });
};

const getWhoMatchYou = async (req, res) => {
	let {
		user: { userId },
		query: { next_cursor },
	} = req;

	const user = await User.findOne({ _id: userId });
	if (!user) {
		throw new CustomError.NotFoundError("Your account does not exist");
	}

	let queryObject = {};
	// find the room chat that you and a user that you matched located
	queryObject.participants = userId;

	let whoMatchYou = Room.find(queryObject).populate({
		path: "participants",
		match: { _id: { $ne: userId } },
		select: "-password -interested -email -role",
	});

	whoMatchYou = whoMatchYou.sort("-createdAt -_id");
	const results = await whoMatchYou;

	res.status(StatusCodes.OK).json({ results, next_cursor });
};

module.exports = {
	swipeProfile,
	getWhoLikeYou,
	getWhoMatchYou,
};
