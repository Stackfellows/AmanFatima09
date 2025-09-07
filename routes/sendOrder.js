import express from "express";
import multer from "multer";
import { 
  createSendOrder, 
  getUserSendOrders, 
  getAllSendOrders,
  updateSendOrder,
  deleteSendOrder,
  getSendOrderById 
} from "../controllers/sendOrder.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

router.post("/", auth, upload.array("images", 5), createSendOrder);

router.get("/user-orders", auth, getUserSendOrders);

router.get("/", getAllSendOrders);

router.get("/:id", getSendOrderById);
router.patch("/:id", auth, upload.array("images", 5), updateSendOrder);
router.delete("/:id", auth, deleteSendOrder);

export default router;
