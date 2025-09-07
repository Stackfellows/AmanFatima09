import express from "express";
import auth from "../middleware/auth.js";
import {
  register,
  login,
  adminLogin,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOtp,
  getAllUsers,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetPasswordToken", resetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// 🔹 Get all users (protected)
router.get("/all", auth, getAllUsers);

// 🔹 Delete user (protected)
router.delete("/:id", auth, deleteUser);

export default router;
