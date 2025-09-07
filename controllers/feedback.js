import FeedbackModel from "../models/feedback.js";

export const createFeedback = async (req, res) => {
  try {
    const { name, feedback, rating } = req.body;
    const { id: userId, email: userEmail, role } = req.user;

    const email = userEmail;

    if (!name || !feedback) {
      return res.status(400).json({ msg: "Please fill all required fields" });
    }

    const newFeedback = new FeedbackModel({ 
      name, 
      email, 
      feedback, 
      rating: rating || 5,
      userId 
    });
    await newFeedback.save();

    res.status(200).json({ msg: "Feedback submitted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server Error, please try again later" });
  }
};

export const getFeedback = async (req, res) => {
  try {
    const feedbacks = await FeedbackModel.find().sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ msg: "Unable to fetch feedback messages" });
  }
};
