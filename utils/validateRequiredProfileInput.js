const CustomError = require("../errors");
const normalCharRegex = /^\w+( +\w+)*$/;
const cloudinaryRegex = /^https:\/\/res.cloudinary.com\//;

const validateRequiredProfileInput = (
    images,
    age,
    gender,
    location,
    hobbies,
    school
) => {
    if (!images || images.length < 1) {
        throw new CustomError.BadRequestError("There must be at least 1 image");
    }
    for (image of images) {
        if (!image.match(cloudinaryRegex)) {
            throw new CustomError.BadRequestError(
                "The image link must be valid"
            );
        }
    }

    if (typeof age !== "number" || age < 18) {
        throw new CustomError.BadRequestError(
            "The age must be valid and at least 18"
        );
    }

    if (gender !== "Male" && gender !== "Female" && gender !== "Other") {
        throw new CustomError.BadRequestError("Gender must be set and valid");
    }

    if (
        location !== "HCM City" &&
        location !== "Hanoi" &&
        location !== "Danang"
    ) {
        throw new CustomError.BadRequestError("Location must be set and valid");
    }

    if (!Array.isArray(hobbies) || hobbies.length < 3) {
        throw new CustomError.BadRequestError(
            "There must be at least 3 hobbies"
        );
    }
    for (hobby of hobbies) {
        if (
            hobby.length < 3 ||
            hobby.length > 20 ||
            !hobby.match(normalCharRegex)
        ) {
            throw new CustomError.BadRequestError(
                "Each hobby must have from 3 to 20 characters and has the right format"
            );
        }
    }

    if (school !== "SSET" && school !== "SCD" && school !== "SBM") {
        throw new CustomError.BadRequestError(
            "RMIT school must be set and valid"
        );
    }
};

module.exports = validateRequiredProfileInput;
