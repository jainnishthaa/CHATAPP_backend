import express from "express";
import mongoose from "mongoose";
import userRouter from "./src/routers/user.js";
import loginRouter from "./src/routers/login.js";
import chatRouter from "./src/routers/chat.js";
import messageRouter from "./src/routers/message.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { verifyJWT } from "./src/utils/verifyJWT.js";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();

const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000','https://chatapp-frontend-black.vercel.app']; // Frontend origins

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from specific origins or requests without an origin (e.g., Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
    origin: function (origin, callback) {
      // Allow requests from specific origins or requests without an origin (e.g., Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
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
      // console.log(newMessageStatus.sender._id);
      if (user !== newMessageStatus.sender._id) {
      socket.in(user).emit("message received", newMessageStatus);
      console.log(`Message sent to user: ${user}`);
      }
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
  .connect("mongodb+srv://nishthaa2003:nishthaa2003@chatappdb.fn5on.mongodb.net/?retryWrites=true&w=majority&appName=ChatAppDB")
  .then(() => {
    httpServer.listen(process.env.PORT, () => {
      console.log("http://localhost:" + process.env.PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });
