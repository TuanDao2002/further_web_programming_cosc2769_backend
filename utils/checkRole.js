const CustomError = require("../errors");
const vendorsList = require("./vendors.json");

const checkRole = (email) => {
    const adminEmail = "cosc2769rmitinder@gmail.com";
    if (email == "") {
        throw new CustomError.UnauthenticatedError("Empty email");
    }

    if (email.match(/^s3[0-9]{6}@rmit\.edu\.vn$/)) {
        return "student";
    }

    if (email === adminEmail) {
        return "admin"
    }

    throw new CustomError.UnauthenticatedError("Invalid email");
};

module.exports = checkRole;
