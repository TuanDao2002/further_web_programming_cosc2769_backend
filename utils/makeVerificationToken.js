const { createJWT } = require("./jwt");

const makeVerificationToken = (username, email, role, password, secretKey) => {
	return createJWT({ payload: { username, email, role, password } }, secretKey);
};

module.exports = makeVerificationToken;
