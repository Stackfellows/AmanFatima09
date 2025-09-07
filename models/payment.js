import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderType: {
      type: String,
      enum: ["sendOrder", "order", "trip"], 
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "orderType", 
    },
    method: {
      type: String,
      enum: ["easypaisa", "bank", "jazzcash", "paypal", "google"],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    screenshot: {
      type: String, // Store the file path or URL of the screenshot
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
