// create, read
const { StatusCodes } = require("http-status-codes");
const Swipe = require("../models/Swipe");
const User = require("../models/User");

const swipeProfile = async (req, res) => {
    const {
        user: { userId },
        body: { to, like },
    } = req;

    const user = await User.findOne({ _id: userId });
    if (!user) {
        throw new CustomError.NotFoundError("Your account does not exist");
    }

    const profile = await User.findOne({ _id: to });
    if (!profile) {
        throw new CustomError.NotFoundError("This profile does not exist");
    }

    const duplicateSwipe = await Swipe.findOne({ from: userId, to });
    if (duplicateSwipe) {
        throw new CustomError.NotFoundError("You already swipe this profile");
    }

    await Swipe.create({ from: userId, to, like });
    res.status(StatusCodes.OK).json({
        msg: `You have swiped ${profile.username}`,
    });
};

const getWhoLikeYou = async (req, res) => {
    const {
        user: { userId },
        query: { next_cursor },
    } = req;

    const user = await User.findOne({ _id: userId });
    if (!user) {
        throw new CustomError.NotFoundError("Your account does not exist");
    }

    let queryObject = {};
    queryObject.to = userId;

    const resultsLimitPerLoading = 10;
    if (next_cursor) {
        const [createdAt, _id] = Buffer.from(next_cursor, "base64")
            .toString("ascii")
            .split("_");

        queryObject.createdAt = { $lte: createdAt };
        queryObject._id = { $lt: _id };
    }

    const whoLikeYou = Swipe.find(queryObject).populate({
        path: "from",
        select: "_id username images",
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

module.exports = {
    swipeProfile,
    getWhoLikeYou,
};
