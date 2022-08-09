const express = require("express");
const router = express.Router();

const {
    swipeProfile,
    getWhoLikeYou,
    getWhoMatchYou
} = require("../controllers/swipeController");

const {
    authenticateUser,
    authorizePermissions,
} = require("../middleware/authentication");

router
    .route("/swipeProfile")
    .post([authenticateUser, authorizePermissions("student")], swipeProfile);

router
    .route("/getWhoLikeYou")
    .get([authenticateUser, authorizePermissions("student")], getWhoLikeYou);

router
    .route("/getWhoMatchYou")
    .get([authenticateUser, authorizePermissions("student")], getWhoMatchYou);

module.exports = router;
