const Swipe = require("../models/Swipe");
const User = require("../models/User");
const Room = require("../models/Room");

const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const swipeProfile = async (req, res) => {
    const {
        user: { userId },
        body: { profileId, like },
    } = req;

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
        throw new CustomError.NotFoundError("You already swipe this profile");
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

    let queryObject = {};
    queryObject.to = userId;
    queryObject.like = true;

    const resultsLimitPerLoading = 10;
    if (next_cursor) {
        const [createdAt, _id] = Buffer.from(next_cursor, "base64")
            .toString("ascii")
            .split("_");

        queryObject.createdAt = { $lte: createdAt };
        queryObject._id = { $lt: _id };
    }

    let whoLikeYou = Swipe.find(queryObject).populate({
        path: "from",
        select: "-password -interested -email -role",
    });

    // return results sorted based on created time (profiles created first will be displayed first)
    whoLikeYou = whoLikeYou.sort("-createdAt -_id");
    whoLikeYou = whoLikeYou.limit(resultsLimitPerLoading);
    const results = await whoLikeYou;

    const count = await Swipe.countDocuments(queryObject);
    next_cursor = null;

    // if the there are still remaining results, create a cursor to load the next ones
    if (count !== results.length) {
        const lastResult = results[results.length - 1];
        next_cursor = Buffer.from(
            lastResult.createdAt.toISOString() + "_" + lastResult._id
        ).toString("base64");
    }

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
    queryObject.participants = userId;

    const resultsLimitPerLoading = 10;
    if (next_cursor) {
        const [createdAt, _id] = Buffer.from(next_cursor, "base64")
            .toString("ascii")
            .split("_");

        queryObject.createdAt = { $lte: createdAt };
        queryObject._id = { $lt: _id };
    }

    let whoMatchYou = Room.find(queryObject).populate({
        path: "participants",
        match: { _id: { $ne: userId } },
        select: "-password -interested -email -role",
    });

    whoMatchYou = whoMatchYou.sort("-createdAt -_id");
    whoMatchYou = whoMatchYou.limit(resultsLimitPerLoading);
    const results = await whoMatchYou;

    const count = await Room.countDocuments(queryObject);
    next_cursor = null;

    // if the there are still remaining results, create a cursor to load the next ones
    if (count !== results.length) {
        const lastResult = results[results.length - 1];
        next_cursor = Buffer.from(
            lastResult.createdAt.toISOString() + "_" + lastResult._id
        ).toString("base64");
    }

    res.status(StatusCodes.OK).json({ results, next_cursor });
};

module.exports = {
    swipeProfile,
    getWhoLikeYou,
    getWhoMatchYou,
};
