// create, read, delete
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");

const Message = require("../models/Message");
const Room = require("../models/Room");
const User = require("../models/User");

const getRoomMessages = async (req, res) => {
    let {
        user: { userId },
        query: { roomId, next_cursor },
    } = req;

    const user = await User.findOne({ _id: userId });
    if (!user) {
        throw new CustomError.NotFoundError("Your account does not exist");
    }

    const room = Room.findOne({ _id: roomId, participants: userId });
    if (!room) {
        throw new CustomError.NotFoundError(
            "This room does not exist or you are not in this room"
        );
    }

    let queryObject = {};
    queryObject.roomId = roomId;

    const resultsLimitPerLoading = 10;
    if (next_cursor) {
        const [createdAt, _id] = Buffer.from(next_cursor, "base64")
            .toString("ascii")
            .split("_");

        queryObject.createdAt = { $lte: createdAt };
        queryObject._id = { $lt: _id };
    }

    let roomMessages = Message.find(queryObject).populate({
        path: "userId",
        select: "username",
    });

    roomMessages = roomMessages.sort("-createdAt -_id");
    roomMessages = roomMessages.limit(resultsLimitPerLoading);
    const results = await roomMessages;

    const count = await Message.countDocuments(queryObject);
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

const createMessage = async (req, res) => {
    const {
        user: { userId },
        body: { roomId, content },
    } = req;

    const user = await User.findOne({ _id: userId });
    if (!user) {
        throw new CustomError.NotFoundError("Your account does not exist");
    }

    const room = Room.findOne({ _id: roomId, participants: userId });
    if (!room) {
        throw new CustomError.NotFoundError(
            "This room does not exist or you are not in this room"
        );
    }

    const newMessage = {
        roomId,
        userId,
        content,
    };

    const message = await Message.create(newMessage);
    res.status(StatusCodes.OK).json({ message });
};

module.exports = {
    getRoomMessages,
    createMessage,
};
