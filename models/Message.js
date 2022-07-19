// roomID -> type: mongoose.Schema.ObjectId, ref: "Room"
// content -> type: String
// userID -> type: mongoose.Schema.ObjectId, ref: "User
// timestamp: true

const mongoose = require("mongoose")

const MessageSchema = new mongoose.Schema(
    {
       roomId: {
        type: mongoose.Types.ObjectId,
        ref: "Room",
        require: true
       },
       
       content: {
        type: String,
        require: true
       },

       userId: {
        type: mongoose.Types.ObjectId,
        reqire: true
       }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Message", MessageSchema)
