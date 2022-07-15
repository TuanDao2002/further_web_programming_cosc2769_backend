const sendEmail = require('./sendEmail');

const sendOTPtoEmail = async (email, otp, browser) => {
    let html = '';
    if (browser) {
        html = `<center><h3>There is an attempt to login from ${browser}. If this is you, enter the OTP below to login</h3></center>
                <center><strong><h1>${otp}</h1></strong></center>`
    } else {
        html = `<center><h3>Your OTP to login is:</h3></center>
        <center><strong><h1>${otp}</h1></strong></center>`
    }
    
    return sendEmail(email, "OTP for login", html)
};

module.exports = sendOTPtoEmail;
