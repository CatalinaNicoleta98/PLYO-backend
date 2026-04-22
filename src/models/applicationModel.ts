import { Schema, model } from "mongoose";
import { Application } from "../interfaces/application";

const applicationSchema = new Schema<Application>(
  {
    companyName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 255,
      trim: true,
    },

    roleTitle: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 255,
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

    jobType: {
      type: String,
      enum: [
        "full_time",
        "part_time",
        "student_job",
        "internship",
        "contract",
        "temporary",
        "freelance",
        "other",
      ],
      default: "other",
    },

    location: {
      type: String,
      trim: true,
    },

    jobUrl: {
      type: String,
      trim: true,
    },

    isRemote: {
      type: Boolean,
      default: false,
    },

    appliedDate: {
      type: Date,
    },

    endedDate: {
      type: Date,
    },

    followUpDate: {
      type: Date,
    },

    interviewContactName: {
      type: String,
      trim: true,
    },

    interviewContactRole: {
      type: String,
      trim: true,
    },

    interviewContactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    otherContacts: [
      {
        name: {
          type: String,
          trim: true,
          required: true,
        },
        role: {
          type: String,
          trim: true,
          required: true,
        },
        email: {
          type: String,
          trim: true,
          lowercase: true,
          required: true,
        },
      },
    ],

    notes: {
      type: String,
      trim: true,
    },

    documents: [
      {
        fileName: {
          type: String,
          required: true,
          trim: true,
        },
        originalName: {
          type: String,
          required: true,
          trim: true,
        },
        mimeType: {
          type: String,
          required: true,
          trim: true,
        },
        size: {
          type: Number,
          required: true,
        },
        url: {
          type: String,
          required: true,
          trim: true,
        },
        category: {
          type: String,
          enum: ["cv", "cover_letter", "portfolio", "other"],
          default: "other",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

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

export const applicationModel = model<Application>(
  "Application",
  applicationSchema
);
