import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { applicationModel } from "../models/applicationModel";
import { connect, disconnect } from "../../repository/db";
import type { ApplicationDocument } from "../interfaces/application";

import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const resolveAuthenticatedUserId = (req: Request): string | null => {
  const token = req.header("auth-token");
  const secret = process.env.TOKEN_SECRET;

  if (!token || !secret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & { _id?: string };
    return typeof decoded._id === "string" ? decoded._id : null;
  } catch {
    return null;
  }
};

const getAuthenticatedUserIdOrRespond = (req: Request, res: Response): string | null => {
  const userId = resolveAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return null;
  }

  return userId;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
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
  const data = req.body;

  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
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
  const id = req.params.id;

  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
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
  const id = req.params.id;

  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  try {
    await connect();

    const { createdBy: _ignoredCreatedBy, ...updateData } = req.body;

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
  const id = req.params.id;

  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
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
  const id = req.params.id;

  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  // multer places file on req.file
  const file = (req as Request & { file?: Express.Multer.File }).file;

  if (!file) {
    res.status(400).json({ error: "No file uploaded", data: null });
    return;
  }

  const category = (req.body?.category as string) || "other";

  try {
    await connect();

    const application = await applicationModel.findOne({ _id: id, createdBy: authenticatedUserId });

    if (!application) {
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
      category: ["cv", "cover_letter", "portfolio", "other"].includes(category)
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
  const { id } = req.params;
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
