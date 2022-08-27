const express = require("express");
const router = express.Router();

const {
    createProfileByAdmin,
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
    .route("/createProfileByAdmin")
    .post([authenticateUser, authorizePermissions("admin")], createProfileByAdmin)

router
    .route("/")
    .get([authenticateUser, authorizePermissions("admin")], getAllUsers)

router
    .route("/profiles")
    .get([authenticateUser, authorizePermissions("student")], getInterestProfiles);

router
    .route("/:id")
    .get([authenticateUser, authorizePermissions("student")], getUserProfile)
    .patch([authenticateUser, authorizePermissions("student", "admin")], updateUser)
    .delete([authenticateUser, authorizePermissions("admin")], deleteUser);

module.exports = router;
