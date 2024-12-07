import ErrorHandler from "../utils/ErrorHandler.js";
import { responseHandler } from "../utils/responseHandler.js";
import User from "../Models/userModel.js";
import Chat from "../Models/chatModel.js";
import Message from "../Models/messageModel.js";

export const getAllMessages = responseHandler(async (req, res, next) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email")
      .populate("receiver")
      .populate("chat");
      // if(!messages){
      //   return res.status(404).json({ message: "No messages found" });
      // }
    res.status(200).json(messages);
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || "cant get all message right now"
    );
  }
});

export const postSendMessage = responseHandler(async (req, res, next) => {
  try {
    const { content, chatId, senderId } = req.body;
    console.log(senderId);
    console.log(content);
    console.log(chatId);
    if (!content || !chatId || !senderId) {
      throw new ErrorHandler(400, "content and chatId are required");
    }
    
    var newMessage = {
      sender: senderId,
      // sender:req.user.userId,
      content: content,
      chat: chatId,
    };
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "name");
    message = await message.populate("chat");
    message = await message.populate("receiver");
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });
    console.log(message);
    res.status(201).json(message);
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || "cant send message right now"
    );
  }
});
