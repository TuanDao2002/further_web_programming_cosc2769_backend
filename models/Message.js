// roomID -> type: mongoose.Schema.ObjectId, ref: "Room"
// content -> type: String
// userID -> type: mongoose.Schema.ObjectId, ref: "User
// timestamp: true

const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Types.ObjectId,
            ref: "Room",
            require: true,
        },

        userId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            reqire: true,
        },

        content: {
            type: String,
            require: true,
            minlength: [1, "Length must be greater than 1"],
            maxlength: [1000, "Length must be less than 1000"],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
