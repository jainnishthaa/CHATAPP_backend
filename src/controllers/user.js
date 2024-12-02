import User from "../Models/userModel.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { responseHandler } from "../utils/responseHandler.js";

export const getFetchUsers = responseHandler(async (req, res, next) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};
  try {
    // console.log(req.user)
    const users = await User.find(keyword).find({
      _id: { $ne: req.user.userId },
    });
    res.send(users);
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || "coudn't fetch users"
    );
  }
});
