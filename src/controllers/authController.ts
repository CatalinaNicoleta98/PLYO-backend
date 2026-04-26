import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Joi, { type ValidationResult } from "joi";
import { Types } from "mongoose";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { applicationModel } from "../models/applicationModel";
import { documentModel } from "../models/documentModel";
import { passwordResetTokenModel } from "../models/passwordResetTokenModel";
import { sendPasswordResetEmail } from "../services/emailService";

// project imports
import { userModel } from "../models/userModel";
import { type User } from "../interfaces/user";
import { connect, disconnect } from "../../repository/db";

// Extend Request type locally to include user
interface AuthenticatedRequest extends Request {
  user?: { _id: string; username?: string };
}

const RESET_TOKEN_EXPIRES_IN_MS = 60 * 60 * 1000;
const passwordResetSuccessMessage = "If an account with that email exists, a password reset link has been sent";

const hashResetToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createResetLink = (token: string): string => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
};

// Register a new user
export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { error, value } = validateUserRegistration(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    await connect();

    const emailExist = await userModel.findOne({ email: value.email });
    if (emailExist) {
      res.status(409).json({ error: "Email is already registered" });
      return;
    }

    const usernameLower = value.username.toLowerCase();
    const usernameExist = await userModel.findOne({ usernameLower });
    if (usernameExist) {
      res.status(409).json({ error: "Username is already taken" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(value.password, salt);

    const userObject = new userModel({
      username: value.username,
      email: value.email,
      password: passwordHashed,
    });

    const savedUser = await userObject.save();

    // 201 is more correct for "created"
    res.status(201).json({ error: null, data: savedUser._id });
  } catch (error) {
    res.status(500).json({ error: "Error registering user" });
  } finally {
    await disconnect();
  }
}

// Login
export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { error, value } = validateUserLogin(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    await connect();

    const usernameLower = value.username.toLowerCase();
    const user = await userModel.findOne({ usernameLower });
    if (!user) {
      res.status(400).json({ error: "Invalid username or password" });
      return;
    }

    const validPassword = await bcrypt.compare(value.password, user.password);
    if (!validPassword) {
      res.status(400).json({ error: "Invalid username or password" });
      return;
    }

    const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET;
    if (!secret) {
      res.status(500).json({ error: "JWT_SECRET is not set" });
      return;
    }

    const token = jwt.sign(
      { _id: user._id.toString(), username: user.username },
      secret,
      { expiresIn: "2h" }
    );

    const userId = user._id.toString();

    // Attach the token in a header (handy for clients) and also return it in JSON
    res
      .status(200)
      .header("auth-token", token)
      .json({ error: null, data: { userId, token, username: user.username } });
  } catch (error) {
    res.status(500).json({ error: "Error logging in" });
  } finally {
    await disconnect();
  }
}

// Request password reset
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { error, value } = validateForgotPasswordInput(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    await connect();

    const user = await userModel.findOne({ email: value.email });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = hashResetToken(token);

      await passwordResetTokenModel.deleteMany({ userId: user._id });
      await passwordResetTokenModel.create({
        userId: user._id,
        token: hashedToken,
      });

      try {
        await sendPasswordResetEmail(value.email, createResetLink(token));
      } catch (error) {
        console.log(`Password reset email could not be sent for ${value.email}`, error);
      }
    }

    res.status(200).json({ error: null, data: passwordResetSuccessMessage });
  } catch {
    res.status(500).json({ error: "Error requesting password reset" });
  } finally {
    await disconnect();
  }
}

// Reset password
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { error, value } = validateResetPasswordInput(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    await connect();

    const hashedToken = hashResetToken(value.token);
    const resetToken = await passwordResetTokenModel.findOne({ token: hashedToken });

    if (!resetToken || !resetToken.createdAt) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const tokenAge = Date.now() - resetToken.createdAt.getTime();

    if (tokenAge > RESET_TOKEN_EXPIRES_IN_MS) {
      await passwordResetTokenModel.deleteOne({ _id: resetToken._id });
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const user = await userModel.findById(resetToken.userId);

    if (!user) {
      await passwordResetTokenModel.deleteOne({ _id: resetToken._id });
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(value.password, salt);

    user.password = passwordHashed;
    await user.save();
    await passwordResetTokenModel.deleteMany({ userId: user._id });

    res.status(200).json({ error: null, data: "Password reset successful" });
  } catch {
    res.status(500).json({ error: "Error resetting password" });
  } finally {
    await disconnect();
  }
}

// Update username
export async function updateUsername(req: Request, res: Response): Promise<void> {
  try {
    const newUsername = typeof req.body?.username === "string" ? req.body.username.trim() : "";

    if (!newUsername || newUsername.length < 3 || newUsername.length > 50) {
      res.status(400).json({ error: "Username must be between 3 and 50 characters" });
      return;
    }

    const userId = (req as AuthenticatedRequest).user?._id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await connect();

    const usernameLower = newUsername.toLowerCase();

    const existingUser = await userModel.findOne({
      usernameLower,
      _id: { $ne: userId },
    });

    if (existingUser) {
      res.status(409).json({ error: "Username is already taken" });
      return;
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        username: newUsername,
        usernameLower,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ error: null, data: { username: updatedUser.username } });
  } catch (error) {
    res.status(500).json({ error: "Error updating username" });
  } finally {
    await disconnect();
  }
}

// Delete account (cascade delete user data)
export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?._id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await connect();

    // 1. find all applications for the user
    const applications = await applicationModel.find({ createdBy: userId });

    // 2. delete all uploaded files from disk
    for (const app of applications) {
      if (!app.documents) continue;

      for (const doc of app.documents) {
        if (!doc.url) continue;

        try {
          const filePath = path.join(process.cwd(), "uploads", path.basename(doc.url));
          await fs.unlink(filePath);
        } catch {
          // ignore file deletion errors (file may already be removed)
        }
      }
    }

    // 3. delete applications
    await applicationModel.deleteMany({ createdBy: userId });

    // 4. delete documents
    await documentModel.deleteMany({ createdBy: userId });

    // 5. delete password reset tokens
    await passwordResetTokenModel.deleteMany({ userId });

    // 6. delete user
    await userModel.findByIdAndDelete(userId);

    res.status(200).json({ error: null, data: "Account deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting account" });
  } finally {
    await disconnect();
  }
}

// validate user registration data (username, email and password)
export function validateUserRegistration(data: User): ValidationResult {
  const schema = Joi.object({
    username: Joi.string().trim().min(3).max(50).required().messages({
      "string.empty": "Username is required",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must be at most 50 characters",
      "any.required": "Username is required",
    }),
    email: Joi.string().trim().lowercase().email().min(6).max(255).required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
      "string.min": "Email must be at least 6 characters",
      "string.max": "Email must be at most 255 characters",
      "any.required": "Email is required",
    }),
    password: Joi.string().trim().min(6).max(255).pattern(/^\S+$/).required().messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password must be at most 255 characters",
      "string.pattern.base": "Password cannot contain spaces",
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data, { abortEarly: true, stripUnknown: true });
}

// validate user login data (username and password)
export function validateUserLogin(data: User): ValidationResult {
  const schema = Joi.object({
    username: Joi.string().trim().min(3).max(50).required().messages({
      "string.empty": "Username is required",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must be at most 50 characters",
      "any.required": "Username is required",
    }),
    password: Joi.string().trim().min(6).max(255).pattern(/^\S+$/).required().messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password must be at most 255 characters",
      "string.pattern.base": "Password cannot contain spaces",
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data, { abortEarly: true, stripUnknown: true });
}

export function validateForgotPasswordInput(data: unknown): ValidationResult {
  const schema = Joi.object({
    email: Joi.string().trim().lowercase().email().min(6).max(255).required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
      "string.min": "Email must be at least 6 characters",
      "string.max": "Email must be at most 255 characters",
      "any.required": "Email is required",
    }),
  });

  return schema.validate(data, { abortEarly: true, stripUnknown: true });
}

export function validateResetPasswordInput(data: unknown): ValidationResult {
  const schema = Joi.object({
    token: Joi.string().trim().required().messages({
      "string.empty": "Reset token is required",
      "any.required": "Reset token is required",
    }),
    password: Joi.string().trim().min(6).max(255).pattern(/^\S+$/).required().messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password must be at most 255 characters",
      "string.pattern.base": "Password cannot contain spaces",
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data, { abortEarly: true, stripUnknown: true });
}

// Middleware to verify the token and protect routes
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.header("auth-token");

  if (!token) {
    res.status(401).json({ error: "Access denied, no token provided" });
    return;
  }

  const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET is not set" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as { _id: string; username?: string };

    if (
      typeof decoded._id !== "string" ||
      !/^[a-f\d]{24}$/i.test(decoded._id) ||
      !Types.ObjectId.isValid(decoded._id)
    ) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      _id: decoded._id,
      username: decoded.username,
    };

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
