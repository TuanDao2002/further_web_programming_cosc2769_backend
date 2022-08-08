const User = require("../models/User");
const CustomError = require("../errors");
const mongoose = require("mongoose");

const { validateRequiredProfileInput } = require("../utils");
const { StatusCodes } = require("http-status-codes");

const getAllUsers = async (req, res) => {
    let { gender, minAge, maxAge, locations, next_cursor } = req.query;

    let queryObject = {};

    queryObject.role = "student";

    // set query conditions if they are set and valid
    if (gender) {
        if (gender !== "Male" && gender !== "Female" && gender !== "Other") {
            throw new CustomError.BadRequestError("Gender must be valid");
        }
        queryObject.gender = gender;
    }

    if (minAge) {
        if (isNaN(minAge) || minAge < 18 || minAge > 100) {
            throw new CustomError.BadRequestError(
                "Min age must be a number and between 18 and 100"
            );
        }
        queryObject.age = { $gte: Number(minAge) };
    }

    if (maxAge) {
        if (isNaN(maxAge) || maxAge < 18 || maxAge > 100) {
            throw new CustomError.BadRequestError(
                "Max age must be a number and between 18 and 100"
            );
        }
        queryObject.age = { ...queryObject.age, $lte: Number(maxAge) };
    }

    if (locations) {
        for (location of locations.split(",")) {
            if (
                location !== "HCM City" &&
                location !== "Hanoi" &&
                location !== "Danang"
            ) {
                throw new CustomError.BadRequestError("Location must be valid");
            }
        }

        queryObject.location = { $in: locations.split(",") };
    }

    // apply cursor based pagination
    const resultsLimitPerLoading = 10;
    if (next_cursor) {
        const [createdAt, _id] = Buffer.from(next_cursor, "base64")
            .toString("ascii")
            .split("_");

        queryObject.createdAt = { $lte: createdAt };
        queryObject._id = { $lt: _id };
    }

    let users = User.find(queryObject).select(
        "-password -interested -email -role"
    );

    // return results sorted based on created time (profiles created first will be displayed first)
    users = users.sort("-createdAt -_id");
    users = users.limit(resultsLimitPerLoading);
    const results = await users;

    const count = await User.countDocuments(queryObject);
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

const getInterestProfiles = async (req, res) => {
    let {
        user: { userId },
        query: { next_cursor },
    } = req;

    const user = await User.findOne({ _id: userId });
    if (!user) {
        throw new CustomError.NotFoundError("Your account does not exist");
    }

    let queryObject = {};
    const {
        hobbies,
        interested: {
            interestedGender,
            interestedMinAge,
            interestedMaxAge,
            interestedLocations,
        },
    } = user;

    queryObject.role = "student";
    queryObject._id = { $ne: userId };
    queryObject.gender = interestedGender;
    queryObject.age = { $gte: interestedMinAge, $lte: interestedMaxAge };
    queryObject.location = { $in: interestedLocations };

    // apply cursor based pagination
    const resultsLimitPerLoading = 10;
    if (next_cursor) {
        const [matchHobby, createdAt, _id] = Buffer.from(next_cursor, "base64")
            .toString("ascii")
            .split("_");

        queryObject.$or = [
            { matchHobby: { $lt: matchHobby === "true" } },
            {
                matchHobby: matchHobby === "true",
                createdAt: { $lte: new Date(createdAt) },
                _id: { $lt: new mongoose.Types.ObjectId(_id) },
            },
        ];
    }

    let userHobbies = [];
    for (hobby of hobbies) {
        userHobbies.push({ $in: [hobby, { $getField: "hobbies" }] });
    }

    // profiles with at least 1 matched hobby will be displayed first
    let results = await User.aggregate([
        {
            $addFields: {
                matchHobby: {
                    $cond: [{ $or: userHobbies }, true, false],
                },
            },
        },

        // return results sorted based on created time (profiles created first will be displayed first)
        {
            $sort: { matchHobby: -1, createdAt: -1, _id: -1 },
        },

        {
            $match: queryObject,
        },

        {
            $limit: resultsLimitPerLoading,
        },

        {
            $project: {
                password: 0,
                interested: 0,
                email: 0,
                role: 0,
            },
        },
    ]);

    // const count = await User.countDocuments(queryObject);
    const totalMatchResults = await User.aggregate([
        {
            $addFields: {
                matchHobby: {
                    $cond: [{ $or: userHobbies }, true, false],
                },
            },
        },

        {
            $match: queryObject,
        },

        {
            $group: {
                _id: null,
                numOfResults: { $sum: 1 },
            },
        },
    ]);
    const count = totalMatchResults[0]?.numOfResults || 0;

    next_cursor = null;
    // if the there are still remaining results, create a cursor to load the next ones
    if (count !== results.length) {
        const lastResult = results[results.length - 1];
        next_cursor = Buffer.from(
            lastResult.matchHobby +
                "_" +
                lastResult.createdAt.toISOString() +
                "_" +
                lastResult._id
        ).toString("base64");
    }

    res.status(StatusCodes.OK).json({ results, next_cursor });
};

const getUserProfile = async (req, res) => {
    const {
        params: { id: profileId },
        user: { userId },
    } = req;

    const user = await User.findOne({ _id: profileId }).select("-password");
    if (!user) {
        throw new CustomError.NotFoundError("This profile does not exist");
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
        throw new CustomError.NotFoundError("This profile does not exist");
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
        interestedLocations,
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
        interestedMinAge > 100 ||
        interestedMaxAge < 18 ||
        interestedMaxAge > 100 ||
        interestedMinAge >= interestedMaxAge
    ) {
        throw new CustomError.BadRequestError(
            "The age range must be from 18 to 100 and the minimum age must be less than the maximum age"
        );
    }

    if (!Array.isArray(interestedLocations) || interestedLocations.length < 1) {
        throw new CustomError.BadRequestError(
            "There must be at least 1 interested location"
        );
    }

    for (interestedLocation of interestedLocations) {
        if (
            interestedLocation !== "HCM City" &&
            interestedLocation !== "Danang" &&
            interestedLocation !== "Hanoi"
        ) {
            throw new CustomError.BadRequestError(
                "The interested location must be valid"
            );
        }
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

const deleteUser = async (req, res) => {
    const {
        params: { id: profileId },
    } = req;
    const user = await User.findOne({ _id: profileId });
    if (!user) {
        throw new CustomError.BadRequestError("This profile does not exist");
    } else {
        await user.remove();
        res.status(StatusCodes.OK).json({ msg: "Success! User removed." });
    }
};

module.exports = {
    getAllUsers,
    getInterestProfiles,
    getUserProfile,
    updateUser,
    deleteUser,
};
