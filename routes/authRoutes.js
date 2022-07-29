const express = require("express");
const router = express.Router();

const {
    authenticateUser,
    authorizePermissions,
} = require("../middleware/authentication");

const {
    register,
    createProfile,
    login,
    logout,
    forgotPassword,
    resetPassword,
} = require("../controllers/authController");

const { uploadUserImage } = require("../controllers/imageController");

router.post("/register", register);
router.post("/createProfile", createProfile);
router.post("/upload-image", uploadUserImage);
router.post("/login", login);
router.delete("/logout", authenticateUser, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
