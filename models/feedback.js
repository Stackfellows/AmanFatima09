import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Email is required to give feedback"],
  },
  feedback: {
    type: String,
    required: [true, "Please write a feedback"],
  },
  rating: {
    type: Number,
    required: [true, "Please enter rating to appreciate pakcarry"],
    min: 1,
    max: 5,
    default: 5
  },
}, { timestamps: true });

const FeedbackModel = mongoose.model("feedback", feedbackSchema);

export default FeedbackModel;
