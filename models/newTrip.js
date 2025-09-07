import mongoose from "mongoose";

const TripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please provide your full name"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Please provide your phone number"],
      validate: {
        validator: function (value) {
          return /^\+92[0-9]{10}$/.test(value);
        },
        message:
          "Please enter a valid phone number. Format: +92 followed by 10 digits (e.g., +923001234567)",
      },
    },
    from: {
      type: String,
      required: [true, "Please select your departure city"],
    },
    to: {
      type: String,
      required: [true, "Please select your destination city"],
    },
    date: {
      type: Date,
      required: [true, "Please Provide Your Travel date"],
      validate: {
        validator: function (value) {
          const selected = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return selected >= today;
        },
        message: "Date cannot be in the past",
      },
    },
    space: {
      type: Number,
      required: [true, "Please enter the package weight i.e max 40kg"],
      max: [40, "Package weight cannot exceed 40kg"],
    },
    price: {
      type: Number,
      required: [true, "Please enter the price for your available space"],
      min: [100, "Price cannot be negative, Price should be greater than 100"],
    },
    description: {
      type: String,
      default: "",
    },
    agree: {
      type: Boolean,
      required: true,
    },
    // Removed status field as per user request
  },
  { timestamps: true }
);

const TripModel = mongoose.model("trip", TripSchema);

export default TripModel;
