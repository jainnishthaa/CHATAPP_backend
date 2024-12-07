import ErrorHandler from "../utils/ErrorHandler.js";
import { responseHandler } from "../utils/responseHandler.js";
import User from "../Models/userModel.js";
import bcrypt from "bcrypt";

const generateAccessTokenAndRefereshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    // user.accessToken = accessToken;

    await user.save();

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

export const postSignup = responseHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  // console.log(name);
  // console.log(email);
  // console.log(password);
  if (!name || !email || !password) {
    throw new ErrorHandler(401, "All fields are required");
  }
  const existingUser = await User.findOne({
    email: email,
  });
  if (existingUser) {
    throw new ErrorHandler(401, "User already exists");
  }
  const usernameExist = await User.findOne({ name: name });
  if (usernameExist) {
    throw new ErrorHandler(401, "Username already taken");
  }
  try {
    let newUser = await User.create({
      name: name,
      email: email,
      password: password,
    });

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefereshToken(newUser._id);
    // console.log(refreshToken);
    // console.log(accessToken);
    const options = {
      httpOnly: true,
    };

    let user = await User.findOne({
      _id: newUser._id,
    }).select("-refreshToken -password");

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        user,
        message: "Successfully Signed Up",
      });
  } catch (error) {
    // console.log(error);
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || "Error while new signup"
    );
  }
});

export const postLogin = responseHandler(async (req, res, next) => {
  const { name, password, email } = req.body;
  // console.log(username);
  try {
    let existingUser = await User.findOne({
      $or: [{ name }, { email }],
    });

    if (!existingUser) {
      throw new ErrorHandler(400, "Please provide correct name or email");
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      throw new ErrorHandler(400, "Incorrect password");
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefereshToken(existingUser._id);
    // console.log(refreshToken);
    // console.log(accessToken);
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    const user = { ...existingUser.toObject() };
    delete user.password;
    delete user.refreshToken;

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        user,
        message: "Successfully Logged In",
      });
  } catch (error) {
    // console.log(error);
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || "cannot log in user"
    );
  }
});

export const getLogout = responseHandler(async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken){
      throw new ErrorHandler(400, "You are not logged in");
    }
    const user = await User.findOne({refreshToken});
    if (!user) {
      throw new ErrorHandler(400,"User not found");
    }
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };
    res
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .status(200)
      .json({ message: "Successfully logged out" });
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || "Can't logout"
    );
  }
});