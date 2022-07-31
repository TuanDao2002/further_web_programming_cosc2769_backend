require("dotenv").config();

const connectDB = require("./db/connect");
const User = require("./models/User");

const jsonUsers = require("./Users.json");

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        await User.deleteMany();
        await User.create(jsonUsers);
        console.log("Success!!!!");
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

start();
