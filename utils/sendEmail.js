const nodemailer = require("nodemailer");

const sendOTPtoEmail = async (email, subject, html) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", // hostname
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL,
            pass: process.env.PASS,
        },
    });

    return transporter.sendMail({
        from: process.env.MAIL,
        to: email,
        subject,
        html,
    });
};

module.exports = sendOTPtoEmail;
