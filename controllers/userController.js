const User = require("../models/User")
const CustomError = require("../errors");

const getAllUsers = async (req, res) => {

}

const deleteUser = async (req, res) => {
    const { params: { id: userId } } = req;
    const user = await User.findOne({ _id: userId })
    if (!user) {
        throw new CustomError.BadRequestError(

        )
    }

}

module.exports = {
    getAllUsers,
    deleteUser,
};