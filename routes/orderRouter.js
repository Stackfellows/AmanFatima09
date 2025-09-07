import express from "express";
import multer from "multer";
import {
  createOrder,
  getOrders,
  getUserOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} from "../controllers/ordercontroller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

router.post("/", auth, upload.array("images", 5), createOrder);
router.get("/", getOrders);
router.get("/user-orders", auth, getUserOrders);
router.get("/:id", getOrderById);
router.patch("/:id", auth, upload.array("images", 5), updateOrder);
router.delete("/:id", auth, deleteOrder);

export default router;
