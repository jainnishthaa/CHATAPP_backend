import express from "express";
import { getFetchUsers } from "../controllers/user.js";

const router=express.Router();
router.get("/fetchUsers",getFetchUsers)

export default router;