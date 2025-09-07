import express from "express";
import { createContact, getContacts } from "../controllers/contact.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createContact);
router.get("/", getContacts);

export default router;
