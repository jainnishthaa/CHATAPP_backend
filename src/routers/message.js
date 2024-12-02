import express from "express";
import { getAllMessages, postSendMessage } from "../controllers/message.js";

const router = express.Router();
router.get("/:chatId",getAllMessages)
router.post("/",postSendMessage);

export default router;