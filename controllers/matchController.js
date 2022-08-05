// create, read
const { StatusCodes } = require("http-status-codes");
const Match = require("../models/Match");
const User = require("../models/User");

const createMatch = async (req, res) => {
    const {
        body: {
            from,
            to
        }
    } = req;
    const newMatch = {
        from,
        to
    };
    const message = await Match.create(newMatch);
    res.status(StatusCodes.OK).json({message})
}

const getAllMatch = async (req,res) => {
    const message = await Match.find();
    res.status(StatusCodes.OK).json({message})
}

module.exports = {
    getAllMatch,
    createMatch,
}

