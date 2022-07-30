const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Please provide username"],
            minlength: [1, "Length must be greater than 1"],
            maxlength: [22, "Length must be less than 22"],
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
                message: "{VALUE} is a not supported role",
            },
            required: true,
        },

        password: {
            type: String,
            required: true,
        },

        images: {
            type: [String],
        },

        age: {
            type: Number,
            min: 18,
        },

        gender: {
            type: String,
            enum: {
                values: ["Male", "Female", "Other"],
                message: "{VALUE} is not a supported gender", // Error message
            },
        },

        location: {
            type: [String],
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
            maxLength: 500,
        },

        school: {
            type: String,
            enum: {
                values: ["SSET", "SBM", "SCD"],
                message: "{VALUE} is not a supported school", // Error message
            },
        },

        interested: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

UserSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (canditatePassword) {
    const isMatch = await bcrypt.compare(canditatePassword, this.password);
    return isMatch;
};

module.exports = mongoose.model("User", UserSchema);
