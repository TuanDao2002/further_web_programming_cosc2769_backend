const { UserModel } = require('../../models');

const createUser = async (name, email, gender, location, hobbies, biography, password) => {
    const newUser = new UserModel({
        name,
        email,
        gender,
        location,
        hobbies,
        biography,
        password,
    });
    const user = await newUser.save();
    return user;
}

const getUserById = async (id) => {
    const user = await UserModel.findById(id);
    return user;
};

const getUserByEmail = async (email) => {
    const user = await UserModel.findOne({ email });
    return user;
};

const getUserByName = async (name) => {
    const user = await UserModel.findOne({ name });
    return user;
};

module.exports = { getUserByEmail, getUserById, getUserByName, createUser };