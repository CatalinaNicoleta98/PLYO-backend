import { Schema, model } from "mongoose";
import { Application } from "../interfaces/application";

const applicationSchema = new Schema<Application>(
  {
    companyName: {
      type: String,
      required: true,
      min: 2,
      max: 255,
      trim: true,
    },

    roleTitle: {
      type: String,
      required: true,
      min: 2,
      max: 255,
      trim: true,
    },

    status: {
      type: String,
      required: true,
      enum: [
        "draft",
        "planned",
        "applied",
        "interview",
        "assignment",
        "offer",
        "rejected",
        "withdrawn",
      ],
      default: "draft",
    },

    companyWebsite: {
      type: String,
    },

    jobPostUrl: {
      type: String,
    },

    applicationUrl: {
      type: String,
    },

    location: {
      type: String,
    },

    workType: {
      type: String,
      enum: ["onsite", "hybrid", "remote"],
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
    },

    dateApplied: {
      type: Date,
    },

    deadline: {
      type: Date,
    },

    nextFollowUpAt: {
      type: Date,
    },

    notes: {
      type: String,
    },

    tags: {
      type: [String],
    },

    cvUrl: {
      type: String,
    },

    coverLetterUrl: {
      type: String,
    },

    otherDocUrls: {
      type: [String],
    },

    createdBy: {
      type: String,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const applicationModel = model<Application>(
  "Application",
  applicationSchema
);