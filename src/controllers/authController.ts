import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Joi, { type ValidationResult } from "joi";

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
      res.status(400).json({ error: "Email is already registered" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(req.body.password, salt);

    const userObject = new userModel({
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

    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "JWT_SECRET is not set" });
      return;
    }

    const token = jwt.sign(
      { _id: user._id.toString(), email: user.email },
      secret,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Error logging in", details: String(error) });
  } finally {
    await disconnect();
  }
}

// validate user registration data (email and password)
export function validateUserRegistration(data: User): ValidationResult {
  const schema = Joi.object({
    email: Joi.string().email().min(6).max(255).required(),
    password: Joi.string().min(6).max(255).required(),
  });

  return schema.validate(data);
}

// validate user login data (email and password)
export function validateUserLogin(data: User): ValidationResult {
  const schema = Joi.object({
    email: Joi.string().email().min(6).max(255).required(),
    password: Joi.string().min(6).max(255).required(),
  });

  return schema.validate(data);
}