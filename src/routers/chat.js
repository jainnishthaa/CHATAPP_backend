import express from "express";
import { getFetchChat, getFetchGroups, postAccessChat, postCreateGroups, putAddSelfToGroup, putGroupExit } from "../controllers/chat.js";

const router=express.Router();
router.get("/fetchChat",getFetchChat);
router.post("/accessChat",postAccessChat);
router.post("/createGroups",postCreateGroups);
router.get("/fetchGroups",getFetchGroups);
router.put("/groupExit",putGroupExit);
router.put("/addSelfToGroup",putAddSelfToGroup);

export default router;