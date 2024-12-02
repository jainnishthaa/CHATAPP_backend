import jwt from "jsonwebtoken";
import ErrorHandler from "./ErrorHandler.js";
import { responseHandler } from "./responseHandler.js";
import User from "../Models/userModel.js";

export const verifyJWT = responseHandler(async function (req, res, next) {
  const incomingAccessToken = req.cookies.accessToken;
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingAccessToken && !incomingRefreshToken) {
    throw new ErrorHandler(401, "you are not logged in!");
  }
  try {
    const decoded = jwt.verify(
      incomingAccessToken,
      process.env.ACCESS_TOKEN_KEY
    );
    req.user = decoded;
    let user = await User.findOne({
      _id: decoded.userId,
    });
    if (!user || incomingRefreshToken !== user.refreshToken) {
      throw new ErrorHandler(401, "user not found ,invalid token");
    }
    next();
  } catch (err) {
    throw new ErrorHandler(401, "invalid token");
  }
});
