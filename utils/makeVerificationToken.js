const { createJWT } = require("./jwt");

const makeVerificationToken = (username, email, role, secretKey) => {
    const expirationDate = new Date();
    expirationDate.setMinutes(new Date().getMinutes() + 2); // verification toke expires after 2 minutes
    return createJWT({ payload: { username, email, role, expirationDate } }, secretKey);
};

module.exports = makeVerificationToken;
