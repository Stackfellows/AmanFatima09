require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {})
    .catch((err) => {});
};
module.exports = connectDB;
