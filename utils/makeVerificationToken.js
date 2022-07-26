const { createJWT } = require("./jwt");

const makeVerificationToken = (username, email, role, password, secretKey) => {
    const expirationDate = new Date();
    expirationDate.setMinutes(new Date().getMinutes() + 2); // verification toke expires after 2 minutes
    return createJWT(
        { payload: { username, email, role, password, expirationDate } },
        secretKey
    );
};

module.exports = makeVerificationToken;
