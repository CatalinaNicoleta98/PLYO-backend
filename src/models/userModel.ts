import { Schema, model } from "mongoose";
import { User } from "../interfaces/user";

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      min: 6,
      max: 255,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      min: 6,
      max: 255,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

export const userModel = model<User>("User", userSchema);
