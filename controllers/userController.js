const createToken = require("../helper/createToken");
const User = require("../models/userModel");
const HttpError = require("../utils/httpError");
const { validationResult } = require("express-validator");
const sendEmail = require("../helper/email");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const authClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
const stripe = require("stripe")(process.env.STRIPE_KEY);

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msgs = errors.array().map((error) => `${error.path}: ${error.msg}`);
    return next(new HttpError(msgs, 422));
  }
  const { email, password } = req.body;
  let user;
  user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new HttpError("email not found", 404));
  }
  if (!user.isVerified) {
    const otp = await user.createOTP();
    const message = `Your Reset Password OTP is ${otp}`;
    try {
      await sendEmail({
        email: user.email,
        subject: "Your Password reset otp (valid for 10 mint)",
        message,
      });
    } catch (err) {
      user.otp = undefined;
      user.otpExpireTime = undefined;
      await user.save({ validateBeforeSave: false });
      return new HttpError("something wrong to send email ", 500);
    }
    return next(new HttpError("user not verified", 403));
  }
  let checkPassword;
  try {
    checkPassword = await bcrypt.compare(password, user.password);
  } catch (error) {
    return next(new HttpError("Error on bcrypt password", 500));
  }
  if (!checkPassword) {
    return next(new HttpError("incorrect Password", 401));
  }
  const token = createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    next
  );
  console.log(token)
  res
    .cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
    })
    .status(201)
    .json({ message: "User login successfully", user });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msgs = errors.array().map((error) => `${error.path}: ${error.msg}`);
    return next(new HttpError(msgs, 422));
  }
  const { name, email, password, cPassword } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    return next(new HttpError("Error user find", 404));
  }
  if (existingUser) {
    return next(new HttpError("user already register", 409));
  }
  const user = new User({
    name,
    email,
    password,
    passwordConfirm: cPassword,
  });
  const otp = await user.createOTP();
  const message = `Your Reset Password OTP is ${otp}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your Password reset otp (valid for 10 mint)",
      message,
    });
  } catch (err) {
    user.otp = undefined;
    user.otpExpireTime = undefined;
    await user.save({ validateBeforeSave: false });
    return new HttpError("something wrong to send email ", 500);
  }
  await user.save();
  const token = createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    next
  );
  res
    .cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
    .status(201)
    .json({ message: "OTP send to email please verify your email" });
};

const forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new HttpError("No user have with this email", 404));
  }
  const otp = await user.createOTP();
  await user.save({ validateBeforeSave: false });
  const message = `Your Reset Password OTP is ${otp}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your Password reset otp (valid for 10 mint)",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "ResetPassword OTP send into email",
    });
  } catch (err) {
    user.otp = undefined;
    user.otpExpireTime = undefined;
    await user.save({ validateBeforeSave: false });
    return new HttpError("something wrong to send email ", 500);
  }
};

const verifyOTP = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msgs = errors.array().map((error) => `${error.path}: ${error.msg}`);
    return next(new HttpError(msgs, 422));
  }
  const { otp, email } = req.body;
  const user = await User.findOne({ email: email });
  if (!user || !(await user.correctOTP(otp, user.otp))) {
    return next(new HttpError("your otp is invalid", 401));
  }
  if (user.otpExpireTime < Date.now()) {
    return next(new HttpError("your otp is expire please try again", 400));
  }
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpireTime = undefined;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    user,
    message: "OTP verification successful",
  });
};
const resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msgs = errors.array().map((error) => `${error.path}: ${error.msg}`);
    return next(new HttpError(msgs, 422));
  }
  const { email, password, passwordConfirm } = req.body;
  const getUser = await User.findOne({ email });
  if (!getUser) {
    return next(new HttpError("OTP is invalid and expire", 400));
  }
  getUser.password = password;
  getUser.passwordConfirm = passwordConfirm;
  getUser.otp = undefined;
  getUser.otpExpireTime = undefined;
  await getUser.save();
  const token = createToken(
    {
      userId: getUser.id,
      email: getUser.email,
    },
    next
  );
  res.status(200).json({
    getUser,
    message: "Your Password Changed successfully",
    token,
  });
};

const googleLogin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msgs = errors.array().map((error) => `${error.path}: ${error.msg}`);
    return next(new HttpError(msgs, 422));
  }

  const { code } = req.body;

  try {
    const { tokens } = await authClient.getToken({
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    });

    authClient.setCredentials(tokens);
    const userInfoResponse = await authClient.request({
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
    });

    const { email } = userInfoResponse.data;
    let existingUser = await User.findOne({ email });
    if (!existingUser) {
      const createUser = new User({
        email,
        isVerified: true,
      });
      await createUser.save({ validateBeforeSave: false });

      const token = createToken(
        {
          userId: createUser.id,
          email: createUser.email,
        },
        next
      );

      return res
        .cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        })
        .status(201)
        .json({ message: "User login successfully" });
    } else {
      const token = createToken(
        {
          userId: existingUser.id,
          email: existingUser.email,
        },
        next
      );

      return res
        .cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        })
        .status(201)
        .json({ message: "User login successfully" });
    }
  } catch (error) {
    console.error({ error });
    return next(new HttpError("Error logging in", 500));
  }
};

const subscriptionController = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError("User not found", 404);
    const startDate = req.body.startsAt || new Date();
    const endDate = req.body.expiresAt;
    if (!endDate || !Date.parse(req.body.expiresAt))
      throw new HttpError("Invalid expiry date", 422);
    const updated = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          "subscription.startedAt": startDate,
          "subscription.expiresAt": endDate,
        },
      },
      { new: true }
    );
    res.status(200).json({
      status: "success",
      data: updated,
    });
  } catch (error) {
    console.error({ error });
    if (error instanceof HttpError) return next(error);
    return next(new HttpError("Error logging in", 500));
  }
};

const addUserCard = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msgs = errors.array().map(error => `${error.path}: ${error.msg}`);
    return next(new HttpError(msgs, 422));
  }

  let existingUser;
  try {
    existingUser = await User.findById(req.userId);
  } catch (error) {
    console.log(error);
    return next(new HttpError('Error fetching user', 500));
  };

  if (!existingUser) {
    return next(new HttpError('No user found', 404));
  }
  let card;
  try {
    card = await stripe.customers.createSource(
      existingUser.customerId,
      { source: req.body.source }
    );
  } catch (error) {
    console.log(error.message);
    return next(new HttpError(error.message, 500));
  };

  res.status(201).json({ message: 'User card saved successfully' });
};

exports.login = login;
exports.signUp = signUp;
exports.forgotPassword = forgotPassword;
exports.verifyOTP = verifyOTP;
exports.resetPassword = resetPassword;
exports.googleLogin = googleLogin;
exports.subscriptionController = subscriptionController;
exports.addUserCard = addUserCard;
