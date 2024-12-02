import express from "express";
import mongoose from "mongoose";
import userRouter from "./routers/user.js";
import loginRouter from "./routers/login.js";
import chatRouter from "./routers/chat.js";
import messageRouter from "./routers/message.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { verifyJWT } from "./utils/verifyJWT.js";

const app=express();

app.use(
  cors({
    origin: process.env.CORS_ORIGINS,
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "4kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "4kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/", loginRouter);
app.use("/user",verifyJWT,userRouter);
app.use("/chat",verifyJWT,chatRouter);
app.use("/message",verifyJWT,messageRouter);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("http://localhost:" + process.env.PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });