const express = require("express");
const router = express.Router();

const {
    getRoomMessages,
    createMessage,
} = require("../controllers/messageController");

const {
    authenticateUser,
    authorizePermissions,
} = require("../middleware/authentication");

router
    .route("/getRoomMessages")
    .get([authenticateUser, authorizePermissions("student")], getRoomMessages);

router
    .route("/createMessage")
    .post([authenticateUser, authorizePermissions("student")], createMessage);

module.exports = router;
