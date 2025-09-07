import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: [true, "Full Name is required"],
    trim: true
  },
  senderPhone: {
    type: String,
    required: [true, "Contact No Is Required"],
    match: [/^\+?\d{10,15}$/, "Please enter a valid phone number"]
  },
  earliestDate: {
    type: String,
    required: [true, "Please select the earliest delivery date"]
  },
  lastDate: {
    type: String,
    required: [true, "Please select the last delivery date"],
    validate: {
      validator: function (value) {
        if (!this.earliestDate || !value) return true;
        const earliest = new Date(this.earliestDate);
        const last = new Date(value);
        return last >= earliest;
      },
      message: "Last date must be equal to or after earliest date"
    }
  },
  from: {
    type: String,
    required: [true, "Please enter the origin city"]
  },
  to: {
    type: String,
    required: [true, "Please enter the destination city"]
  },
  weight: {
    type: Number,
    required: [true, "Please enter the package weight i.e max 40kg"]
  },
  description: {
    type: String
  },
  images: [String],
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    default: "pending"
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
