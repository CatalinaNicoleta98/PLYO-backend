import { Schema, model } from "mongoose";
import { PasswordResetToken } from "../interfaces/passwordResetToken";

const passwordResetTokenSchema = new Schema<PasswordResetToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  token: {
    type: String,
    required: true,
    index: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600,
  },
});

export const passwordResetTokenModel = model<PasswordResetToken>(
  "PasswordResetToken",
  passwordResetTokenSchema
);
