import type { Types } from "mongoose";

export type DocumentType = "cv" | "cover_letter";

export interface Document {
  _id: string;
  title: string;
  type: DocumentType;
  content: string;
  linkedApplicationId?: Types.ObjectId | string | null;
  createdBy: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}
