import express from "express";
import { getLogout, postLogin, postSignup } from "../controllers/login.js";

const router=express.Router();
router.post("/login",postLogin);
router.post("/signup",postSignup);
router.get('/logout',getLogout);

export default router;