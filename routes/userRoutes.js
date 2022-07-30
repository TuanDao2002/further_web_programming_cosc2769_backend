const express = require("express");
const router = express.Router();

const {
    getAllUsers,
    getInterestProfiles,
    getUserProfile,
    updateUser,
    deleteUser,
} = require("../controllers/userController");

const {
    authenticateUser,
    authorizePermissions,
} = require("../middleware/authentication");

router
    .route("/")
    .get([authenticateUser, authorizePermissions("admin")], getAllUsers)
    .delete([authenticateUser, authorizePermissions("admin")], deleteUser);

router
    .route("/profiles")
    .get(
        [authenticateUser, authorizePermissions("student")],
        getInterestProfiles
    );

router
    .route("/:id")
    .get([authenticateUser, authorizePermissions("student")], getUserProfile)
    .patch([authenticateUser, authorizePermissions("student")], updateUser);

module.exports = router;
