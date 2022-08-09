// _id of Room is the id of Socket.io
// users -> [mongoose.Schema.ObjectId], ref: "User"
const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
    participants: {
        type: [mongoose.Types.ObjectId],
        ref: "User",
        require: true,
    },
});

module.exports = mongoose.model("Room", RoomSchema);
