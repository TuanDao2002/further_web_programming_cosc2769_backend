// from -> type: mongoose.Schema.ObjectId, ref: "User"
// from -> type: mongoose.Schema.ObjectId, ref: "User"

const mongoose = require("mongoose");

const SwipeSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },

    to: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },

    like: {
        type: Boolean,
        required: true,
    },
});

module.exports = mongoose.model("Swipe", SwipeSchema);
