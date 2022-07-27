const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: [true, "Please provide username"],
		minlength: [3, "Length must be greater than 3"],
		maxlength: [20, "Length must be less than 20"],
		trim: true,
		unique: true,
	},

	email: {
		type: String,
		required: [true, "Please provide email"],
		unique: true,
		trim: true,
		validate: {
			validator: validator.isEmail,
			message: "Please provide valid email",
		},
	},

	role: {
		type: String,
		enum: {
			values: ["admin", "student"],
			message: "{VALUE} is not supported",
		},
		required: true,
	},

	password: {
		type: String,
		required: true,
	},

	gender: {
		type: String,
		enum: {
			values: ["Male", "Female", "Other"],
			message: "{VALUE} is not a supported category", // Error message
		},
	},

	location: {
		type: String,
		enum: {
			values: ["HCM City", "Hanoi", "Danang"],
			message: "{VALUE} is not a supported location", // Error message
		},
	},

	hobbies: {
		type: [String],
	},

	biography: {
		type: String,
		maxLength: 100,
	},

	major: {
		type: String,
		enum: {
			values: ["SSET", "SBM", "SCD"],
			message: "{VALUE} is not a supported major", // Error message
		},
	},
});

UserSchema.pre("save", async function () {
	if (!this.isModified("password")) return;
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (canditatePassword) {
	const isMatch = await bcrypt.compare(canditatePassword, this.password);
	return isMatch;
};

module.exports = mongoose.model("User", userSchema);
