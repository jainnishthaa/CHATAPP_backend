import ErrorHandler from "../utils/ErrorHandler.js";
import { responseHandler } from "../utils/responseHandler.js";
import User from "../Models/userModel.js";
import Chat from "../Models/chatModel.js";

export const postAccessChat = responseHandler(async (req, res, next) => {
  // console.log(req);
  try {
    const { otherUserId } = req.body;
    // console.log(otherUserId);
    if (!otherUserId) {
      throw new ErrorHandler(400, "user id not awailable");
    }
    var isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $in: req.user.userId } },
        { users: { $in: otherUserId } },
      ],
    })
      .populate("users", "-refreshToken -password")
      .populate("latestMessage");
    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name email",
    });
    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      var chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.user.userId, otherUserId],
      };
    }
    const createdChat = await Chat.create(chatData);
    const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "users",
      "-password"
    );
    res.status(200).json(FullChat);
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || "can not access chat right now"
    );
  }
});

export const getFetchChat = responseHandler(async (req, res, next) => {
  try {
    // console.log(req.user.userId)
    Chat.find({ users: { $in: req.user.userId } })
      .populate("users", "-refreshToken -password")
      .populate("groupAdmin", "-refreshToken -password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name email",
        });
        // console.log(results);
        res.status(200).json(results);
      });
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || " can not fetch chats right now"
    );
  }
});

export const postCreateGroups = responseHandler(async (req, res, next) => {
  if (!req.body.name) {
    return res.status(400).send({ message: "Data is insufficient" });
  }
  // console.log(req.body.name);
  var users = [];
  users.push(req.user.userId);
  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user.userId,
    });
    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-refreshToken -password")
      .populate("groupAdmin", "-refreshToken -password");
    res.status(201).json(fullGroupChat);
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || " can not create group right now"
    );
  }
});

export const getFetchGroups = responseHandler(async (req, res, next) => {
  try {
    const allGroups = await Chat.where("isGroupChat").equals(true);
    res.status(200).send(allGroups);
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || " can not fetch groups right now"
    );
  }
});

export const putGroupExit = responseHandler(async (req, res, next) => {
  try {
    const { chatId, userId } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new ErrorHandler(404, "Chat not found");
    }
    if (chat.isGroupChat) {
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: {
            users: userId,
          },
        },
        { new: true }
      )
      .populate("users", "-refreshToken -password")
      .populate("groupAdmin", "-refreshToken -password");
      if(!updatedChat){
        throw new ErrorHandler(404, "Fsiled to exit group chat");
      }
      res.status(200).json(updatedChat);
    }
    else{
      const deleteChat=await Chat.findByIdAndDelete(chatId);
      if(!deleteChat){
        throw new ErrorHandler(404, "Failed to delete chat");
      }
      res.status(200).json({message:"Chat delted successfully"});
    }
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || "cna not exit group right now"
    );
  }
});

export const putAddSelfToGroup = responseHandler(async (req, res, next) => {
  try {
    const { chatId, userId } = req.body;
    const added = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { users: userId },
      },
      {
        new: true,
      }
    )
      .populate("users", "-refreshToken -password")
      .populate("groupAdmin", "-refreshToken -password");
    if (!added) {
      throw new ErrorHandler(404, "Chat not found");
    } else {
      res.json(added);
    }
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || "can't add self to group right now"
    );
  }
});
