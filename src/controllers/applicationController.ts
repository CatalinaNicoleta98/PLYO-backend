import { Request, Response } from "express";
import { Types } from "mongoose";
import { applicationModel } from "../models/applicationModel";
import { connect, disconnect } from "../../repository/db";
import type { ApplicationDocument, ApplicationStatus, JobType } from "../interfaces/application";

import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";


const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const validApplicationStatuses = [
  "draft",
  "planned",
  "applied",
  "interview",
  "assignment",
  "offer",
  "rejected",
  "withdrawn",
] as const;
const validJobTypes = [
  "full_time",
  "part_time",
  "student_job",
  "internship",
  "contract",
  "temporary",
  "freelance",
  "other",
] as const;
const validDocumentCategories = ["cv", "cover_letter", "portfolio", "other"] as const;

interface AuthenticatedRequest extends Request {
  user?: { _id: string };
}

type ApplicationInput = {
  companyName?: string;
  roleTitle?: string;
  status?: ApplicationStatus;
  jobType?: JobType;
  location?: string;
  jobUrl?: string;
  isRemote?: boolean;
  appliedDate?: Date | null;
  endedDate?: Date | null;
  followUpDate?: Date | null;
  interviewContactName?: string;
  interviewContactRole?: string;
  interviewContactEmail?: string;
  otherContacts?: Array<{ name: string; role: string; email: string }>;
  notes?: string;
  documents?: ApplicationDocument[];
};
type StringApplicationField =
  | "location"
  | "jobUrl"
  | "interviewContactName"
  | "interviewContactRole"
  | "interviewContactEmail"
  | "notes";

type UploadedApplicationFile = {
  fieldname: string;
  originalname: string;
  mimetype: string;
  filename: string;
  size: number;
};

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const getAuthenticatedUserIdOrRespond = (req: Request, res: Response): string | null => {
  const userId = (req as AuthenticatedRequest).user?._id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return null;
  }

  return userId;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isValidObjectId = (value: string): boolean => {
  return /^[a-f\d]{24}$/i.test(value) && Types.ObjectId.isValid(value);
};

const getParamValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
};

const deleteUploadedFileIfExists = (fileName: string): void => {
  try {
    const uploadPath = path.join(UPLOAD_DIR, path.basename(fileName));

    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
    }
  } catch {
    // ignore file deletion errors
  }
};

const sanitizeOptionalString = (
  data: Record<string, unknown>,
  key: StringApplicationField,
  target: ApplicationInput
): string | null => {
  if (data[key] === undefined) {
    return null;
  }

  if (typeof data[key] !== "string") {
    return `${key} must be a string`;
  }

  target[key] = data[key].trim();
  return null;
};

const sanitizeOptionalDate = (
  data: Record<string, unknown>,
  key: "appliedDate" | "endedDate" | "followUpDate",
  target: ApplicationInput
): string | null => {
  if (data[key] === undefined) {
    return null;
  }

  if (data[key] === null || data[key] === "") {
    target[key] = null;
    return null;
  }

  const date = new Date(data[key] as string | number | Date);

  if (Number.isNaN(date.getTime())) {
    return `${key} must be a valid date`;
  }

  target[key] = date;
  return null;
};

const sanitizeApplicationDocuments = (documents: unknown): ApplicationDocument[] | null => {
  if (!Array.isArray(documents)) {
    return null;
  }

  const sanitizedDocuments: ApplicationDocument[] = [];

  for (const document of documents) {
    if (!isRecord(document)) {
      return null;
    }

    const fileName = typeof document.fileName === "string" ? path.basename(document.fileName.trim()) : "";
    const originalName = typeof document.originalName === "string" ? document.originalName.trim() : "";
    const mimeType = typeof document.mimeType === "string" ? document.mimeType.trim() : "";
    const size = typeof document.size === "number" ? document.size : -1;
    const category = typeof document.category === "string" ? document.category.trim() : "other";
    const uploadedAt =
      document.uploadedAt === undefined || document.uploadedAt === null
        ? new Date()
        : new Date(document.uploadedAt as string | number | Date);

    if (
      !fileName ||
      !originalName ||
      !mimeType ||
      size < 0 ||
      Number.isNaN(uploadedAt.getTime()) ||
      !validDocumentCategories.includes(category as ApplicationDocument["category"])
    ) {
      return null;
    }

    sanitizedDocuments.push({
      fileName,
      originalName,
      mimeType,
      size,
      url: `/uploads/${fileName}`,
      category: category as ApplicationDocument["category"],
      uploadedAt,
    });
  }

  return sanitizedDocuments;
};

const validateApplicationInput = (
  data: unknown,
  requireAllFields: boolean
): { error: string | null; data: ApplicationInput } => {
  if (!isRecord(data)) {
    return { error: "Invalid request body", data: {} };
  }

  const sanitizedData: ApplicationInput = {};

  if (requireAllFields || data.companyName !== undefined) {
    if (typeof data.companyName !== "string" || data.companyName.trim().length < 2) {
      return { error: "companyName is required", data: {} };
    }

    sanitizedData.companyName = data.companyName.trim();
  }

  if (requireAllFields || data.roleTitle !== undefined) {
    if (typeof data.roleTitle !== "string" || data.roleTitle.trim().length < 2) {
      return { error: "roleTitle is required", data: {} };
    }

    sanitizedData.roleTitle = data.roleTitle.trim();
  }

  if (data.status !== undefined) {
    const status = typeof data.status === "string" ? data.status.trim() : "";

    if (!validApplicationStatuses.includes(status as ApplicationStatus)) {
      return { error: "status is invalid", data: {} };
    }

    sanitizedData.status = status as ApplicationStatus;
  }

  if (data.jobType !== undefined) {
    const jobType = typeof data.jobType === "string" ? data.jobType.trim() : "";

    if (!validJobTypes.includes(jobType as JobType)) {
      return { error: "jobType is invalid", data: {} };
    }

    sanitizedData.jobType = jobType as JobType;
  }

  for (const key of [
    "location",
    "jobUrl",
    "interviewContactName",
    "interviewContactRole",
    "interviewContactEmail",
    "notes",
  ] as const) {
    const error = sanitizeOptionalString(data, key, sanitizedData);

    if (error) {
      return { error, data: {} };
    }
  }

  if (data.isRemote !== undefined) {
    if (typeof data.isRemote !== "boolean") {
      return { error: "isRemote must be a boolean", data: {} };
    }

    sanitizedData.isRemote = data.isRemote;
  }

  for (const key of ["appliedDate", "endedDate", "followUpDate"] as const) {
    const error = sanitizeOptionalDate(data, key, sanitizedData);

    if (error) {
      return { error, data: {} };
    }
  }

  if (data.otherContacts !== undefined) {
    if (!Array.isArray(data.otherContacts)) {
      return { error: "otherContacts must be an array", data: {} };
    }

    const otherContacts = [];

    for (const contact of data.otherContacts) {
      if (!isRecord(contact)) {
        return { error: "otherContacts are invalid", data: {} };
      }

      const name = typeof contact.name === "string" ? contact.name.trim() : "";
      const role = typeof contact.role === "string" ? contact.role.trim() : "";
      const email = typeof contact.email === "string" ? contact.email.trim() : "";

      if (!name || !role || !email) {
        return { error: "otherContacts are invalid", data: {} };
      }

      otherContacts.push({ name, role, email });
    }

    sanitizedData.otherContacts = otherContacts;
  }

  if (data.documents !== undefined) {
    const documents = sanitizeApplicationDocuments(data.documents);

    if (!documents) {
      return { error: "documents are invalid", data: {} };
    }

    sanitizedData.documents = documents;
  }

  return { error: null, data: sanitizedData };
};

const storage: StorageEngine = multer.diskStorage({
  destination: (
    _req: Request,
    _file: UploadedApplicationFile,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (
    _req: Request,
    file: UploadedApplicationFile,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({ storage });

// CRUD - Create, Read, Update, Delete
export async function createApplication(
  req: Request,
  res: Response
): Promise<void> {
  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  const { error: validationError, data } = validateApplicationInput(req.body, true);

  if (validationError) {
    res.status(400).json({ error: validationError, data: null });
    return;
  }

  try {
    await connect();

    const application = new applicationModel({
      ...data,
      createdBy: authenticatedUserId,
    });
    const result = await application.save();

    res.status(201).json({ error: null, data: result });
  } catch (error) {
    res.status(500).json({ error: "Error creating application entry", data: null });
  } finally {
    await disconnect();
  }
}

export async function getAllApplications(
  req: Request,
  res: Response
): Promise<void> {
  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  try {
    await connect();

    const result = await applicationModel.find({ createdBy: authenticatedUserId });

    res.status(200).json({ error: null, data: result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error retrieving applications", data: null });
  } finally {
    await disconnect();
  }
}

export async function getApplicationById(
  req: Request,
  res: Response
): Promise<void> {
  const id = getParamValue(req.params.id);

  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  if (!id || !isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid application id", data: null });
    return;
  }

  try {
    await connect();

    const result = await applicationModel.findOne({ _id: id, createdBy: authenticatedUserId });

    if (!result) {
      res
        .status(404)
        .json({ error: `Application entry with id=${id} was not found`, data: null });
      return;
    }

    res.status(200).json({ error: null, data: result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error retrieving application entry", data: null });
  } finally {
    await disconnect();
  }
}

export async function updateApplicationById(
  req: Request,
  res: Response
): Promise<void> {
  const id = getParamValue(req.params.id);

  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  if (!id || !isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid application id", data: null });
    return;
  }

  const { error: validationError, data: updateData } = validateApplicationInput(req.body, false);

  if (validationError) {
    res.status(400).json({ error: validationError, data: null });
    return;
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No valid fields provided", data: null });
    return;
  }

  try {
    await connect();

    const result = await applicationModel.findOneAndUpdate(
      { _id: id, createdBy: authenticatedUserId },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!result) {
      res
        .status(404)
        .json({ error: `Cannot update application entry with id=${id}`, data: null });
      return;
    }

    res.status(200).json({ error: null, data: result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating application entry by id", data: null });
  } finally {
    await disconnect();
  }
}

export async function deleteApplicationById(
  req: Request,
  res: Response
): Promise<void> {
  const id = getParamValue(req.params.id);

  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  if (!id || !isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid application id", data: null });
    return;
  }

  try {
    await connect();

    const result = await applicationModel.findOneAndDelete({ _id: id, createdBy: authenticatedUserId });

    if (!result) {
      res
        .status(404)
        .json({ error: `Cannot delete application entry with id=${id}`, data: null });
      return;
    }

    for (const document of result.documents || []) {
      try {
        const uploadPath = path.join(UPLOAD_DIR, path.basename(document.fileName));

        if (fs.existsSync(uploadPath)) {
          fs.unlinkSync(uploadPath);
        }
      } catch {
        // ignore file deletion errors (file may already be removed)
      }
    }

    res.status(200).json({ error: null, data: true });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting application entry by id", data: null });
  } finally {
    await disconnect();
  }
}

export async function uploadApplicationDocument(
  req: Request,
  res: Response
): Promise<void> {
  const id = getParamValue(req.params.id);

  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }


  // multer places file on req.file
  const file = (req as Request & { file?: UploadedApplicationFile }).file;

  if (!file) {
    res.status(400).json({ error: "No file uploaded", data: null });
    return;
  }

  const cleanupUploadedFile = () => {
    deleteUploadedFileIfExists(file.filename);
  };

  if (!id || !isValidObjectId(id)) {
    cleanupUploadedFile();
    res.status(400).json({ error: "Invalid application id", data: null });
    return;
  }

  const category = typeof req.body?.category === "string" ? req.body.category.trim() : "other";

  try {
    await connect();

    const application = await applicationModel.findOne({ _id: id, createdBy: authenticatedUserId });

    if (!application) {
      cleanupUploadedFile();
      res
        .status(404)
        .json({ error: `Application entry with id=${id} was not found`, data: null });
      return;
    }

    const document: ApplicationDocument = {
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      category: validDocumentCategories.includes(category as ApplicationDocument["category"])
        ? (category as ApplicationDocument["category"])
        : "other",
      uploadedAt: new Date(),
    };

    if (!application.documents) {
      application.documents = [];
    }

    application.documents.push(document);

    const result = await application.save();

    res.status(200).json({ error: null, data: result });
  } catch (error) {
    cleanupUploadedFile();
    res
      .status(500)
      .json({ error: "Error uploading application document", data: null });
  } finally {
    await disconnect();
  }
}

export async function deleteApplicationDocument(
  req: Request,
  res: Response
): Promise<void> {
  const id = getParamValue(req.params.id);
  const fileNameParam = req.params.fileName;
  const fileName = Array.isArray(fileNameParam) ? fileNameParam[0] : fileNameParam;

  if (!fileName) {
    res.status(400).json({ error: "fileName is required", data: null });
    return;
  }

  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  if (!id || !isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid application id", data: null });
    return;
  }

  try {
    await connect();

    const application = await applicationModel.findOne({
      _id: id,
      createdBy: authenticatedUserId,
    });

    if (!application) {
      res
        .status(404)
        .json({ error: `Application entry with id=${id} was not found`, data: null });
      return;
    }

    const documentIndex = application.documents?.findIndex(
      (document) => document.fileName === fileName
    );

    if (documentIndex === undefined || documentIndex < 0) {
      res
        .status(404)
        .json({ error: `Document with fileName=${fileName} was not found`, data: null });
      return;
    }

    application.documents?.splice(documentIndex, 1);
    const result = await application.save();

    const uploadPath = path.join(UPLOAD_DIR, path.basename(fileName));

    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
    }

    res.status(200).json({ error: null, data: result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting application document", data: null });
  } finally {
    await disconnect();
  }
}
