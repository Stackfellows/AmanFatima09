import express from "express";
import { createFeedback, getFeedback } from "../controllers/feedback.js";
import auth from "../middleware/auth.js";

const feedbackRouter = express.Router();

feedbackRouter.post("/", auth, createFeedback);
feedbackRouter.get("/", getFeedback);

export default feedbackRouter;
