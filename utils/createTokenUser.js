const createTokenUser = (user) => {
    return { name: user.username, userId: user._id, role: user.role, email: user.email };
};

module.exports = createTokenUser;
