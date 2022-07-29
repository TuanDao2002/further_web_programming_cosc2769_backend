const express = require("express");
const router = express.Router();

const {
    getAllUsers,
    updateUser,
    deleteUsers,
} = require("../controllers/userController");

const {
    authenticateUser,
    authorizePermissions,
} = require("../middleware/authentication");

router.route("/").get(getAllUsers);

router
    .route("/:id")
    .patch([authenticateUser, authorizePermissions("student")], updateUser);

router.route("/").delete(deleteUsers);

module.exports = router;
