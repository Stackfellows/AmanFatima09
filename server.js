import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import userRouter from "./routes/userRouter.js";
import contactRouter from "./routes/contact.js";
import tripRouter from "./routes/trip.js";
import feedbackRouter from "./routes/feedback.js";
import orderRouter from "./routes/orderRouter.js";
import newSendRouter from "./routes/sendOrder.js";
import paymentRouter from "./routes/payment.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://fyp-backend-yxwi.onrender.com",
      // Add your production frontend URL here when deployed
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Origin",
    "Accept",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// 🔹 Root route safe response
app.get("/", (req, res) => {
  res.send("🚀 Backend is running successfully!");
});

// Routers
app.use("/users", userRouter);
app.use("/contact", contactRouter);
app.use("/feedback", feedbackRouter);
app.use("/trip", tripRouter);
app.use("/orders", orderRouter);
app.use("/send-order", newSendRouter);
app.use("/payments", paymentRouter);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email transporter ready");
  }
});

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection error:", err.message);
  }
};

app.listen(process.env.PORT || 8000, () => {
  const port = process.env.PORT || 8000;
  console.log(`Server is up and listening on port ${port}`);
  connect();
});
