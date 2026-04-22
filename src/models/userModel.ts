import { Schema, model } from "mongoose";
import { User } from "../interfaces/user";

const userSchema = new Schema<User>(
  {
    username: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
      unique: true,
      trim: true,
    },

    usernameLower: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 255,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Invalid email format",
      },
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 255,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

userSchema.pre("validate", function () {
  if (this.username) {
    this.usernameLower = this.username.toLowerCase().trim();
  }
});

export const userModel = model<User>("User", userSchema);
