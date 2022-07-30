const User = require("../models/User");
const CustomError = require("../errors");

const { validateRequiredProfileInput } = require("../utils");
const { StatusCodes } = require("http-status-codes");

const getAllUsers = async (req, res) => {
    const users = await User.find();
    res.status(StatusCodes.OK).json({ users, count: users.length });
};

const getUserProfile = async (req, res) => {
    const {
        params: { id: profileId },
        user: { userId },
    } = req;

    const user = await User.findOne({ _id: profileId }).select("-password");
    if (!user) {
        throw new CustomError.BadRequestError("This profile does not exist");
    }

    if (userId !== profileId) {
        throw new CustomError.BadRequestError("You cannot view this profile");
    }

    res.status(StatusCodes.OK).json({ user });
};

const normalCharRegex = /^[A-Za-z0-9._-]*$/;
const updateUser = async (req, res) => {
    const {
        params: { id: profileId },
        body: {
            username,
            images,
            age,
            gender,
            location,
            hobbies,
            biography,
            school,
            interested,
        },
        user: { userId },
    } = req;

    const user = await User.findOne({ _id: profileId });
    if (!user) {
        throw new CustomError.BadRequestError("This profile does not exist");
    }

    if (userId !== profileId) {
        throw new CustomError.BadRequestError("You cannot edit this profile");
    }

    if (!username || username.length < 1 || username.length > 22) {
        throw new CustomError.BadRequestError(
            "The username must have from 1 to 22 characters"
        );
    }

    // prevent SQL injection
    if (!username.match(normalCharRegex)) {
        throw new CustomError.BadRequestError(
            "The username must not have strange characters"
        );
    }

    validateRequiredProfileInput(
        images,
        age,
        gender,
        location,
        hobbies,
        school
    );

    if (biography === undefined || biography.length > 500) {
        throw new CustomError.BadRequestError(
            "Biography must be defined and less than 500 characters"
        );
    }

    const {
        interestedGender,
        interestedMinAge,
        interestedMaxAge,
        interestedLocation,
    } = interested;

    if (
        interestedGender !== "Male" &&
        interestedGender !== "Female" &&
        interestedGender !== "Other"
    ) {
        throw new CustomError.BadRequestError(
            "The interested gender must be valid"
        );
    }

    if (
        typeof interestedMinAge !== "number" ||
        typeof interestedMaxAge !== "number"
    ) {
        throw new CustomError.BadRequestError(
            "Interested min and max age must be set"
        );
    }

    if (
        interestedMinAge < 18 ||
        interestedMaxAge > 100 ||
        interestedMinAge >= interestedMaxAge
    ) {
        throw new CustomError.BadRequestError(
            "The age range must be from 18 to 100 and the minimum age must be less than the maximum age"
        );
    }

    if (
        interestedLocation !== "HCM City" &&
        interestedLocation !== "Danang" &&
        interestedLocation !== "Hanoi"
    ) {
        throw new CustomError.BadRequestError(
            "The interested location must be valid"
        );
    }

    user.username = username;
    user.images = images;
    user.age = age;
    user.gender = gender;
    user.location = location;
    user.hobbies = hobbies;
    user.biography = biography;
    user.school = school;
    user.interested = interested;
    await user.save();

    res.status(StatusCodes.OK).json({
        msg: "Your profile is updated successfully",
    });
};

const deleteUsers = async (req, res) => {
    const {
        params: { id: userId },
    } = req;
    const user = await User.findOne({ _id: userId });
    if (!user) {
        throw new CustomError.BadRequestError();
    } else {
        User.remove();
        res.status(StatusCodes.OK).json({ msg: "Success! User removed." });
    }
};

module.exports = {
    getAllUsers,
    getUserProfile,
    updateUser,
    deleteUsers,
};
