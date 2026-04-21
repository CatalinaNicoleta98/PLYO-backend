import { Schema, model } from "mongoose";
import { Document } from "../interfaces/document";

const documentSchema = new Schema<Document>(
  {
    title: {
      type: String,
      required: true,
      min: 2,
      max: 120,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["cv", "cover_letter"],
    },

    content: {
      type: String,
      required: true,
    },

    linkedApplicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const documentModel = model<Document>("Document", documentSchema);
