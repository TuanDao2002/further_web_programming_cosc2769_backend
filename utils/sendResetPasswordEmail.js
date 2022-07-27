const sendEmail = require("./sendEmail");

const sendResetPasswordEmail = async (
    browser,
    email,
    verificationToken,
    origin
) => {
    // send the verification link to React and React will POST to server

    const resetURL = `${origin}/reset-password?token=${verificationToken}`;
    const message = `<center><h3>There is a new attempt to reset password with this email at ${browser} browser.</h3></center>
                    <center><h3>If this was you, clicking on the following link (it will expire after 10 minutes): <a href="${resetURL}">Reset password</a></h3><center>`;
    return sendEmail(email, "Reset password", message);
};

module.exports = sendResetPasswordEmail;
