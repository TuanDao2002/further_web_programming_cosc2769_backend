const CustomError = require("../errors");
const vendorsList = require("./vendors.json");

const checkRole = (username, email) => {
    if (email == "") {
        throw new CustomError.UnauthenticatedError("Empty email");
    }

    if (email.match(/^s3[0-9]{6}@rmit\.edu\.vn$/)) {
        for (let vendor of vendorsList) {
            if (vendor.vendorName === username) {
                throw new CustomError.UnauthenticatedError(
                    "Cannot use vendor's name for username of student account"
                );
            }
        }
        return "student";
    }

    if (email.match(/^[\w.+\-]+@gmail\.com$/)) {
        for (let vendor of vendorsList) {
            if (vendor.vendorName === username && vendor.email === email) {
                return "vendor";
            }
        }
        throw new CustomError.UnauthenticatedError("The Gmail address or username does not match with a vendor's account");
    }

    throw new CustomError.UnauthenticatedError("Invalid email");
};

module.exports = checkRole;
