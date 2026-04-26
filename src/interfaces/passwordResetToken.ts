import type { Types } from "mongoose";

export interface PasswordResetToken {
  _id: string;
  userId: Types.ObjectId | string;
  token: string;
  createdAt?: Date;
}
