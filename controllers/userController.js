import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
  } else {
  }
});

const createToken = (id, role, email) => {
  return jwt.sign({ id, role, email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const mockAdminUser = {
      _id: "admin_1",
      name: "Aman Fatima",
      email: ADMIN_EMAIL,
      role: "admin",
    };
    const token = createToken(mockAdminUser._id, mockAdminUser.role, mockAdminUser.email);
    res.status(200).json({
      msg: "Admin Logged In Successfully",
      token,
      user: mockAdminUser,
    });
  } else {
    res.status(401).json({ msg: "Invalid admin credentials" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const mockAdminUser = {
      _id: "admin123",
      name: "Admin User",
      email,
      role: "admin",
    };
    const token = createToken(mockAdminUser._id, mockAdminUser.role, mockAdminUser.email);
    return res.status(200).json({
      msg: "Admin Logged In Successfully",
      token,
      user: mockAdminUser,
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    if (!user.isVerified)
      return res.status(403).json({ msg: "Please verify your email." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = createToken(user._id, user.role, user.email);
    res.status(200).json({ msg: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ msg: "User already exists" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (user && !user.isVerified) {
      user.name = name;
      user.password = hashedPassword;
    } else {
      user = new User({
        name,
        email,
        password: hashedPassword,
        role: "user",
        isVerified: false,
      });
    }

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(rawOtp).digest("hex");
    user.emailVerificationOTP = otpHash;
    user.emailVerificationOTPExpiry = Date.now() + 3 * 60 * 1000;

    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Verify your email - OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0ac6ae;">Hi ${user.name},</h2>
          <p>Your email verification code is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 3px;">${rawOtp}</p>
          <p>This code will expire in 3 minutes.</p>
          <br>
          Regards,PakCarryTeam
        </div>
      `,
    };

    transporter.sendMail(mailOptions).catch((emailError) => {
    });

    res.status(201).json({
      msg: "OTP sent to your email. Please verify to complete registration.",
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error during registration." });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ msg: "User not found with that email." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordTokenExpiry = Date.now() + 3600000;
    await user.save();

    const frontendBase = process.env.FRONTEND_URL || "https://fyp-backend-yxwi.onrender.com";
    const resetUrl = `${frontendBase}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0ac6ae;">Password Reset Request</h2>
          <p>Dear ${user.name},</p>
          <p>You have requested to reset your password. Please click on the link below to reset your password. This link is valid for one hour.</p>
          <a href="${resetUrl}" style="background-color: #0ac6ae; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      msg: "Password reset link sent to your email.",
    });
  } catch (error) {
    res.status(500).json({
      msg: "Error sending email. Please try again.",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.resetPasswordToken).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: "Password reset token is invalid or has expired." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ msg: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ msg: "Server error during password reset." });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    if (user.isVerified) {
      return res.status(200).json({ msg: "Email already verified. You can login now." });
    }

    const providedHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (
      !user.emailVerificationOTP ||
      user.emailVerificationOTP !== providedHash ||
      !user.emailVerificationOTPExpiry ||
      user.emailVerificationOTPExpiry < Date.now()
    ) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpiry = undefined;
    await user.save();

    const welcome = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Welcome! Your email is verified",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0ac6ae;">Welcome, ${user.name}!</h2>
          <p>Your email has been verified successfully. You can now login.</p>
        </div>
      `,
    };
    transporter.sendMail(welcome).catch(() => {});

    res.status(200).json({ msg: "Email verified successfully. Please login." });
  } catch (error) {
    res.status(500).json({ msg: "Server error during OTP verification." });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ msg: "Email already verified" });
    }

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(rawOtp).digest("hex");
    user.emailVerificationOTP = otpHash;
    user.emailVerificationOTPExpiry = Date.now() + 3 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your new verification code",
      html: `<p>Your new OTP is <strong>${rawOtp}</strong>. It expires in 3 minutes.</p>`,
    };
    transporter.sendMail(mailOptions).catch((e) => {});

    res.status(200).json({ msg: "A new OTP has been sent to your email." });
  } catch (error) {
    res.status(500).json({ msg: "Server error while resending OTP." });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0, emailVerificationOTP: 0, emailVerificationOTPExpiry: 0, resetPasswordToken: 0, resetPasswordTokenExpiry: 0 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ msg: "Server error while fetching users." });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.status(200).json({ msg: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error while deleting user." });
  }
};
