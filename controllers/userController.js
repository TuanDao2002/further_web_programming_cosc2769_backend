const User = require("../models/User")
const CustomError = require("../errors");

const getAllUsers = async (req, res) => {
    const users = await User.find();
    res.status(StatusCodes.OK).json({ users, count: users.length });
}

const deleteUsers = async (req, res) => {
    const { params: { id: userId } } = req;
    const user = await User.findOne({ _id: userId });
    if (!user) {
        throw new CustomError.BadRequestError();
    }else{
        User.remove();
        res.status(StatusCodes.OK).json({ msg: 'Success! User removed.' });
    };
}

module.exports = {
    getAllUsers,
    deleteUsers,
};