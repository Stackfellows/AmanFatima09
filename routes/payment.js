import express from "express";
import multer from "multer";
import {
  createPayment,
  getPaymentsByOrder,
  getAllPayments,
  updatePaymentStatus,
  deletePayment,
} from "../controllers/paymentController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

router.post("/", upload.single("screenshot"), createPayment);
router.get("/", getAllPayments); // New endpoint to get all payments
router.get("/:orderId", getPaymentsByOrder);
router.put("/:id", updatePaymentStatus);
router.delete("/:id", deletePayment);

export default router;
