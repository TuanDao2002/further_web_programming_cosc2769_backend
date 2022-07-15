const sendEmail = require("./sendEmail");
const checkRole = require("./checkRole");

const sendVerificationEmail = async (browser, email, verificationToken, origin) => {
    // send the verification link to React and React will POST to server

    const verifyEmail = `${origin}/verify-email?token=${verificationToken}`;
    const message = `<center><h3>There is a new sign up with this email at ${browser} browser.</h3></center>
                    <center><h3>If this was you, clicking on the following link (it will expire after 2 minutes): <a href="${verifyEmail}">Verify Email</a></h3><center>`;
    return sendEmail(email, "Email confirmation", message);
};

module.exports = sendVerificationEmail;
