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
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();

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

const httpServer = createServer(app);
const io = new Server(httpServer,{
  cors: {
    origin: process.env.CORS_ORIGINS,
  }
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("setup", (user) => {
    if (!user || !user._id) {
      return console.log("Invalid user data received during setup.");
    }
    socket.join(user._id);
    socket.emit("connected");
    console.log(`User setup: ${user._id}`);
  });

  socket.on("join chat", (room) => {
    if (room) {
      socket.join(room);
      console.log(`User joined chat room: ${room}`);
      socket.emit("joined chat", room);
    } else {
      console.log("No room specified for joining.");
    }
  });

  socket.on("new message", (newMessageStatus) => {
    const chat = newMessageStatus.chat;
    if (!chat || !chat.users) {
      return console.log("chat or chat.users not defined");
    }
    chat.users.forEach((user) => {
      if (user._id == newMessageStatus.sender._id) return;
      socket.in(user._id).emit("message received", newMessageStatus);
      console.log(`Message sent to user: ${user._id}`);
    });

    socket.on("leave chat", (room) => {
      if (room) {
        socket.leave(room);
        console.log(`User left chat room: ${room}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
});

app.use("/", loginRouter);
app.use("/user", verifyJWT, userRouter);
app.use("/chat", verifyJWT, chatRouter);
app.use("/message", verifyJWT, messageRouter);

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
