import { Request, Response } from "express";
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

  // Minimal validation to avoid confusing Mongoose errors
  if (!data?.createdBy) {
    res.status(400).json({ error: "createdBy is required", data: null });
    return;
  }

  try {
    await connect();

    const application = new applicationModel(data);
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
  try {
    await connect();

    const result = await applicationModel.find({});

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

  try {
    await connect();

    const result = await applicationModel.findById(id);

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

  try {
    await connect();

    const result = await applicationModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

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

  try {
    await connect();

    const result = await applicationModel.findByIdAndDelete(id);

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

  // multer places file on req.file
  const file = (req as Request & { file?: Express.Multer.File }).file;

  if (!file) {
    res.status(400).json({ error: "No file uploaded", data: null });
    return;
  }

  const category = (req.body?.category as string) || "other";

  try {
    await connect();

    const application = await applicationModel.findById(id);

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