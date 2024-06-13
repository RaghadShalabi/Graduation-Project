import bcrypt from "bcryptjs";
import victimModel from "../../../../DB/victim.model.js";
import rescueTeamsModel from "../../../../DB/rescueTeam.model.js";
import jwt from "jsonwebtoken";
import sendEmail from "../../../services/sendEmail.js";
import { customAlphabet } from "nanoid";

export const signUp = async (req, res, next) => {
  const { name, email, city, password, isVictim = false } = req.body;

  let newUser;
  const hashPassword = bcrypt.hashSync(
    password,
    parseInt(process.env.SALT_ROUND)
  ); // Hash password only once and use it for both models

  if (isVictim) {
    const existingVictim = await victimModel.findOne({ email });
    if (existingVictim) {
      return next(new Error("Email already in use", { cause: 409 }));
    }
    newUser = await victimModel.create({
      name,
      email,
      city,
      password: hashPassword,
      isVictim,
    });
  } else {
    const existingRescueTeam = await rescueTeamsModel.findOne({ email });
    if (existingRescueTeam) {
      return next(new Error("Email already in use", { cause: 409 }));
    }
    newUser = await rescueTeamsModel.create({
      name,
      email,
      city,
      password: hashPassword,
    });
  }

  if (!newUser) {
    return next(new Error("Error while creating user", { cause: 500 }));
  }

  const token = jwt.sign({ email: email }, process.env.SECRET_KEY_EMAIL, {
    expiresIn: "1h",
  });

  const link = `${req.protocol}://${req.headers.host}/auth/confirmEmail/${token}`;

  const html = `<div>
        <h2>Verify email</h2>
        <p>Hi ${name},</b><br><br>
        Your account has been created successfully!<br> 
        Please click on the following link to verify your email address.</p>
        <div>
            <a href="${link}">Confirm Email</a>
        </div>
    </div>`;

  await sendEmail(email, "Welcome", html);

  if (newUser.role === "RescueTeam") {
    return res.status(201).json({
      message:
        "Account created successfully. Please verify your email to sign in. Your account will be reviewed by an super admin before activation.",
      newUser,
    });
  }

  return res.status(201).json({
    message: "account created successfully, plz verify your email to signIn",
    newUser,
  });
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  // Attempt to find the user in both collections
  let user = await victimModel.findOne({ email });
  let isVictim = true;

  if (!user) {
    user = await rescueTeamsModel.findOne({ email });
    isVictim = false;
  }

  // If no user is found in either model
  if (!user) {
    return next(new Error("Email not found", { cause: 404 }));
  }

  // Check if the user is a RescueTeam and if their account has been approved by an admin
  if (!isVictim && user.role === "RescueTeam" && !user.acceptedAdmin) {
    return next(
      new Error("Your account has not been approved by an super admin yet.", {
        cause: 403,
      })
    );
  }

  // Check if the email has been confirmed
  if (!user.confirmEmail) {
    return next(new Error("Please confirm your email!", { cause: 403 }));
  }

  // Compare the provided password with the hashed password stored
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return next(new Error("Password incorrect", { cause: 409 }));
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: isVictim ? user.role /*"Victim"*/ : user.role /*"RescueTeam"*/,
    },
    process.env.SIGN_IN_SECRET_KEY
    //,{ expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    {
      id: user._id,
      role: isVictim ? user.role /*"Victim"*/ : user.role /*"RescueTeam"*/,
    },
    process.env.SIGN_IN_SECRET_KEY
    //,{ expiresIn: 60 * 60 * 24 * 30 }
  );

  return res.status(200).json({
    message: "Success login",
    token,
    refreshToken,
    role: isVictim ? user.role /*"Victim"*/ : user.role /*"RescueTeam"*/, // Inform the client about the user's role
  });
};

export const confirmEmail = async (req, res, next) => {
  const { token } = req.params; // Retrieve the token from the URL parameter

  const decodedToken = jwt.verify(token, process.env.SECRET_KEY_EMAIL);
  if (!decodedToken) {
    return next(new Error("invalid token", { cause: 404 }));
  }

  let user = await victimModel.findOneAndUpdate(
    { email: decodedToken.email, confirmEmail: false },
    { confirmEmail: true },
    { new: true }
  );

  if (!user) {
    // If no user found in victimModel, check in rescueTeamsModel
    user = await rescueTeamsModel.findOneAndUpdate(
      { email: decodedToken.email, confirmEmail: false },
      { confirmEmail: true },
      { new: true }
    );
  }

  if (!user) {
    return next(
      new Error("user not found or your email is verified", { cause: 404 })
    );
  }

  // Check if the user is a RescueTeam and redirect them to the sign-in page
  if (user.role === "RescueTeam") {
    return res.redirect(process.env.SIGN_IN);
  }

  return res
    .status(200)
    .json({ message: "Email confirmed successfully", user });
};

// Controller to send reset password code to the user
export const sendCode = async (req, res, next) => {
  const { email } = req.body;

  // Check if the user exists in victimModel
  let user = await victimModel.findOne({ email });
  let isVictim = true;

  // If user is not found in victimModel, check rescueTeamsModel
  if (!user) {
    user = await rescueTeamsModel.findOne({ email });
    isVictim = false;
  }

  // If user not found in either model, return error
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  // Generate a 6-digit random code
  let code = customAlphabet("1234567890", 6);
  code = code();

  // Email the reset password code to the user
  const username = user.name; // Get user's name, or use "User" if name is not available
  const userType = isVictim ? user.role : user.role; // Determine the user type
  const html = `<h2>Reset Password</h2>
        <b>Hi ${username},</b>
        <p>This email is to help you reset your password for your ${userType} account.</p>
        <p>Your reset password code is: <strong>${code}</strong></p>
        <p>If you did not request this code, you can ignore this email.</p>`;
  await sendEmail(email, "Reset Password", html);

  // Save the code in the user's document in victimModel or rescueTeamsModel based on the user type
  if (isVictim) {
    user = await victimModel.findOneAndUpdate(
      { email },
      { sendCode: code },
      { new: true }
    );
  } else {
    user = await rescueTeamsModel.findOneAndUpdate(
      { email },
      { sendCode: code },
      { new: true }
    );
  }
  return res.status(201).json({ message: "success", user });
};

export const forgetPassword = async (req, res, next) => {
  const { newPassword, code } = req.body;
  const email = req.headers["email"]; // Read the email from the request Headers

  // Find user by email in victimModel
  let user = await victimModel.findOne({ email });
  let isVictim = true;

  // If user is not found in victimModel, check rescueTeamsModel
  if (!user) {
    user = await rescueTeamsModel.findOne({ email });
    isVictim = false;
  }

  // If user not found in either model, return error
  if (!user) {
    return next(new Error("Not a registered account", { cause: 409 }));
  }

  // Check if the provided code matches the one sent to the user
  if (user.sendCode !== code) {
    return next(new Error("Invalid code", { cause: 409 }));
  }

  // Check if the new password is the same as the old one
  const match = bcrypt.compareSync(newPassword, user.password);
  if (match) {
    return next(
      new Error("Same password, please enter another password", { cause: 409 })
    );
  }

  // Check if the new password has been used before
  const previousPasswords = user.previousPasswords || [];
  const isPasswordUsedBefore = previousPasswords.some((hash) =>
    bcrypt.compareSync(newPassword, hash)
  );
  if (isPasswordUsedBefore) {
    return next(
      new Error(
        "New password must be different from previously used passwords",
        { cause: 409 }
      )
    );
  }

  // Hash the new password
  const hashNewPassword = bcrypt.hashSync(
    newPassword,
    parseInt(process.env.SALT_ROUND)
  );

  //store the old password in the previousPasswords array
  previousPasswords.push(user.password);

  // Update user's password and reset the code
  user.password = hashNewPassword;
  user.previousPasswords = previousPasswords;
  user.sendCode = null;
  user.changePasswordTime = Date.now();
  await user.save();

  return res.status(201).json({ message: "Password reset successfully" });
};
