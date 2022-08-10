const { createJWT } = require("./jwt");

const makeVerificationToken = (username, email, role, password, secretKey, minutesToExpire) => {
    const expirationDate = new Date();
    expirationDate.setMinutes(new Date().getMinutes() + minutesToExpire); // verification toke expires after a given minutes
    return createJWT(
        { payload: { username, email, role, password, expirationDate } },
        secretKey
    );
};

module.exports = makeVerificationToken;
