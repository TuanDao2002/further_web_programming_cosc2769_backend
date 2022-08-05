// create, read, delete
const { StatusCodes } = require("http-status-codes");
const Message = require("../models/Room");
const User = require("../models/User");

const getAllMessage = async (req,res) => {
    const message = await Message.find();
    res.status(StatusCodes.OK).json({message})
}

const createMessage = async (req, res) => {
    const {
        body: {
            roomId,
            content,
            userId
        }
    } = req;
    const newMessage = {
        roomId,
        content,
        userId
    };
    const message = await Message.create(newMessage);
    res.status(StatusCodes.OK).json({message})
}

const getMessage = async (req, res) => {
    const { _id: messageId } = req.params;
    const message = await Message.findOne({ _id: messageId});
    res.status(StatusCodes.OK).json({message});
}

const deleteMessage = async (req, res) => {
    const { _id: messageId } = req.params;
    const message = await Message.findByIdAndDelete({ _id: messageId});

}

module.exports = {
    getAllMessage,
    createMessage,
    getMessage,
    deleteMessage
}