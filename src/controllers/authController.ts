import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Joi, { type ValidationResult } from "joi";
import fs from "fs/promises";
import path from "path";
import { applicationModel } from "../models/applicationModel";

// project imports
import { userModel } from "../models/userModel";
import { type User } from "../interfaces/user";
import { connect, disconnect } from "../../repository/db";

// Register a new user
export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { error } = validateUserRegistration(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    await connect();

    const emailExist = await userModel.findOne({ email: req.body.email });
    if (emailExist) {
      res.status(409).json({ error: "Email is already registered" });
      return;
    }

    const usernameLower = String(req.body.username).toLowerCase().trim();
    const usernameExist = await userModel.findOne({ usernameLower });
    if (usernameExist) {
      res.status(409).json({ error: "Username is already taken" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(req.body.password, salt);

    const userObject = new userModel({
      username: req.body.username,
      email: req.body.email,
      password: passwordHashed,
    });

    const savedUser = await userObject.save();

    // 201 is more correct for "created"
    res.status(201).json({ error: null, data: savedUser._id });
  } catch (error) {
    res.status(500).json({ error: "Error registering user", details: String(error) });
  } finally {
    await disconnect();
  }
}

// Login
export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { error } = validateUserLogin(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    await connect();

    const usernameLower = String(req.body.username).toLowerCase().trim();
    const user = await userModel.findOne({ usernameLower });
    if (!user) {
      res.status(400).json({ error: "Invalid username or password" });
      return;
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
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
    res.status(500).json({ error: "Error logging in", details: String(error) });
  } finally {
    await disconnect();
  }
}

// Update username
export async function updateUsername(req: Request, res: Response): Promise<void> {
  try {
    const newUsername = String(req.body.username || "").trim();

    if (!newUsername || newUsername.length < 3 || newUsername.length > 50) {
      res.status(400).json({ error: "Username must be between 3 and 50 characters" });
      return;
    }

    const token = req.header("auth-token");
    const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET;

    if (!token || !secret) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, secret) as { _id: string };
    const userId = decoded._id;

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
    res.status(500).json({ error: "Error updating username", details: String(error) });
  } finally {
    await disconnect();
  }
}

// Delete account (cascade delete user data)
export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    const token = req.header("auth-token");
    const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET;

    if (!token || !secret) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, secret) as { _id: string };
    const userId = decoded._id;

    await connect();

    // 1. find all applications for the user
    const applications = await applicationModel.find({ createdBy: userId });

    // 2. delete all uploaded files from disk
    for (const app of applications) {
      if (!app.documents) continue;

      for (const doc of app.documents) {
        if (!doc.url) continue;

        try {
          const filePath = path.join(process.cwd(), doc.url);
          await fs.unlink(filePath);
        } catch {
          // ignore file deletion errors (file may already be removed)
        }
      }
    }

    // 3. delete applications
    await applicationModel.deleteMany({ createdBy: userId });

    // 4. delete user
    await userModel.findByIdAndDelete(userId);

    res.status(200).json({ error: null, data: "Account deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting account", details: String(error) });
  } finally {
    await disconnect();
  }
}

// validate user registration data (username, email and password)
export function validateUserRegistration(data: User): ValidationResult {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().min(6).max(255).required(),
    password: Joi.string().min(6).max(255).required(),
  });

  return schema.validate(data);
}

// validate user login data (username and password)
export function validateUserLogin(data: User): ValidationResult {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(255).required(),
  });

  return schema.validate(data);
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
    // Verify token validity
    jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}