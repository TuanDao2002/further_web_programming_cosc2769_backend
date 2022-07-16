const express = require('express');
const router = express.Router();

const {
    getAllUsers,
    deleteUsers,
} = require('../controllers/userController');

router.route('/').get(getAllUsers);
router.route('/').delete(deleteUsers);

module.exports = router;