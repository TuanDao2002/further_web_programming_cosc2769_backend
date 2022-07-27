const { createJWT } = require("./jwt");

const makeVerificationToken = (username, email, role, password, secretKey) => {
    const expirationDate = new Date();
    expirationDate.setMinutes(new Date().getMinutes() + 10); // verification toke expires after 10 minutes
    return createJWT(
        { payload: { username, email, role, password, expirationDate } },
        secretKey
    );
};

module.exports = makeVerificationToken;
