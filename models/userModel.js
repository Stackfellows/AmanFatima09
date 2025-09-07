import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 4,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: String,
    emailVerificationOTPExpiry: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpiry: Date,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
