const express = require("express");
const router = express.Router();

const {
    swipeProfile,
    getWhoLikeYou,
} = require("../controllers/swipeController");

const {
    authenticateUser,
    authorizePermissions,
} = require("../middleware/authentication");

router
    .route("/swipeProfile")
    .patch([authenticateUser, authorizePermissions("student")], swipeProfile);

router
    .route("/getWhoLikeYou")
    .get([authenticateUser, authorizePermissions("student")], getWhoLikeYou);

module.exports = router;
