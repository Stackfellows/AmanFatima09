import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Your Name"],
  },
  email: {
    type: String,
    required: [true, "Please Enter Your Email"],
  },
  message: {
    type: String,
    required: [true, "Write Your Message"],
  },
}, { timestamps: true });

const contactModel = mongoose.model("Contact", contactSchema);

export default contactModel;
