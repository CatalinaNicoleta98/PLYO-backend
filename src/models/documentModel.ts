import { Schema, model } from "mongoose";
import { Document } from "../interfaces/document";

const documentSchema = new Schema<Document>(
  {
    title: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 120,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["cv", "cover_letter"],
      trim: true,
    },

    content: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "content is required",
      },
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
