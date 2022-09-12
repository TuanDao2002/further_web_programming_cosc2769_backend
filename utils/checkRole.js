const CustomError = require("../errors");

const checkRole = (email) => {
    const adminEmail = "cosc2769rmitinder@gmail.com";
    if (email == "") {
        throw new CustomError.UnauthenticatedError("Empty email");
    }

    if (email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
        return "student";
    }

    if (email === adminEmail) {
        return "admin"
    }

    throw new CustomError.UnauthenticatedError("Invalid email");
};

module.exports = checkRole;
