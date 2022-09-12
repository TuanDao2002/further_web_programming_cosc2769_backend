const CustomError = require("../errors");
const { isTokenValid } = require("../utils");

const User = require("../models/User");
const Room = require("../models/Room");

const socketio = (server) => {
	const io = require("socket.io")(server, {
		cors: {
			origin: ["https://rmit-tinder.netlify.app", "http://localhost:3000"],
		},
	});

	io.on("connection", (socket) => {
		console.log(socket.id);

		socket.on("new-user", (newUser) => {
			console.log(newUser);
		});

		socket.on("join-room", async (userId, roomId) => {
			try {
				const user = await User.findOne({
					_id: userId,
					role: "student",
				});
				if (!user) {
					throw new CustomError.BadRequestError("Invalid authentication");
				}

				const room = await Room.findOne({
					_id: roomId,
					participants: userId,
				});

				if (!room) {
					throw new CustomError.BadRequestError("Invalid room");
				}

				console.log(room.participants);
				socket.join(roomId);
			} catch (err) {
				socket.to(roomId).emit("error", err.message);
			}
		});

		socket.on("send-chat-message", async (data) => {
			const { userId, roomId, message } = data;

			try {
				const user = await User.findOne({
					_id: userId,
					role: "student",
				});
				if (!user) {
					throw new CustomError.BadRequestError("Invalid authentication");
				}

				const room = await Room.findOne({
					_id: roomId,
					participants: userId,
				});

				if (!room) {
					throw new CustomError.BadRequestError("Invalid room");
				}

				socket.broadcast
					.to(roomId)
					.emit("chat-message", { userId, name: user.username, message });
				console.log(user.username);
			} catch (err) {
				socket.to(roomId).emit("error", err.message);
			}
		});
	});

	io.use(async (socket, next) => {
		const accessToken = socket.handshake.auth.token;

		try {
			const payload = isTokenValid(accessToken, process.env.JWT_SECRET);
			const userId = payload.tokenUser.userId;

			const user = await User.findOne({ _id: userId, role: "student" });
			if (!user) {
				next(new Error("Authentication Invalid"));
			}

			next();
		} catch (err) {
			next(new Error("Authentication Invalid"));
		}
	});
};

module.exports = socketio;
