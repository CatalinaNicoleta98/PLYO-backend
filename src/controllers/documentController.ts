import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { applicationModel } from "../models/applicationModel";
import { documentModel } from "../models/documentModel";
import { connect, disconnect } from "../../repository/db";

const validDocumentTypes = ["cv", "cover_letter"] as const;
type DocumentInput = {
  title?: string;
  type?: (typeof validDocumentTypes)[number];
  content?: string;
  linkedApplicationId?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isValidDocumentType = (
  value: string
): value is (typeof validDocumentTypes)[number] => {
  return validDocumentTypes.includes(value as (typeof validDocumentTypes)[number]);
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

const resolveAuthenticatedUserId = (req: Request): string | null => {
  const token = req.header("auth-token");
  const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET;

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

const validateDocumentInput = (
  data: unknown,
  requireAllFields: boolean
): { error: string | null; data: DocumentInput } => {
  if (!isRecord(data)) {
    return { error: "Invalid request body", data: {} };
  }

  const sanitizedData: DocumentInput = {};

  if (requireAllFields || data.title !== undefined) {
    if (typeof data.title !== "string") {
      return { error: "title is required", data: {} };
    }

    const title = data.title.trim();

    if (title.length < 2) {
      return { error: "title is required", data: {} };
    }

    sanitizedData.title = title;
  }

  if (requireAllFields || data.content !== undefined) {
    if (typeof data.content !== "string" || data.content.trim().length < 1) {
      return { error: "content is required", data: {} };
    }

    sanitizedData.content = data.content;
  }

  if (requireAllFields || data.type !== undefined) {
    if (typeof data.type !== "string") {
      return { error: "type must be either cv or cover_letter", data: {} };
    }

    const type = data.type.trim();

    if (!isValidDocumentType(type)) {
      return { error: "type must be either cv or cover_letter", data: {} };
    }

    sanitizedData.type = type;
  }

  if (data.linkedApplicationId !== undefined) {
    if (data.linkedApplicationId === null) {
      sanitizedData.linkedApplicationId = null;
    } else if (typeof data.linkedApplicationId === "string") {
      const linkedApplicationId = data.linkedApplicationId.trim();

      if (!isValidObjectId(linkedApplicationId)) {
        return { error: "linkedApplicationId must be a valid id", data: {} };
      }

      sanitizedData.linkedApplicationId = linkedApplicationId;
    } else {
      return { error: "linkedApplicationId must be a valid id", data: {} };
    }
  }

  return { error: null, data: sanitizedData };
};

const verifyLinkedApplicationOwnership = async (
  linkedApplicationId: string | null | undefined,
  authenticatedUserId: string
): Promise<boolean> => {
  if (!linkedApplicationId) {
    return true;
  }

  const application = await applicationModel.findOne({
    _id: linkedApplicationId,
    createdBy: authenticatedUserId,
  });

  return Boolean(application);
};

export async function createDocument(
  req: Request,
  res: Response
): Promise<void> {
  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  const { error: validationError, data } = validateDocumentInput(req.body, true);

  if (validationError) {
    res.status(400).json({ error: validationError, data: null });
    return;
  }

  try {
    await connect();

    const ownsLinkedApplication = await verifyLinkedApplicationOwnership(
      data.linkedApplicationId,
      authenticatedUserId
    );

    if (!ownsLinkedApplication) {
      res.status(404).json({ error: "Linked application was not found", data: null });
      return;
    }

    const document = new documentModel({
      ...data,
      createdBy: authenticatedUserId,
    });
    const result = await document.save();

    res.status(201).json({ error: null, data: result });
  } catch (error) {
    res.status(500).json({ error: "Error creating document", data: null });
  } finally {
    await disconnect();
  }
}

export async function getAllDocuments(
  req: Request,
  res: Response
): Promise<void> {
  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  try {
    await connect();

    const result = await documentModel.find({ createdBy: authenticatedUserId });

    res.status(200).json({ error: null, data: result });
  } catch (error) {
    res.status(500).json({ error: "Error retrieving documents", data: null });
  } finally {
    await disconnect();
  }
}

export async function getDocumentById(
  req: Request,
  res: Response
): Promise<void> {
  const id = getParamValue(req.params.id);
  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  if (!id) {
    res.status(400).json({ error: "Invalid document id", data: null });
    return;
  }

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid document id", data: null });
    return;
  }

  try {
    await connect();

    const result = await documentModel.findOne({ _id: id, createdBy: authenticatedUserId });

    if (!result) {
      res.status(404).json({ error: `Document with id=${id} was not found`, data: null });
      return;
    }

    res.status(200).json({ error: null, data: result });
  } catch (error) {
    res.status(500).json({ error: "Error retrieving document", data: null });
  } finally {
    await disconnect();
  }
}

export async function updateDocumentById(
  req: Request,
  res: Response
): Promise<void> {
  const id = getParamValue(req.params.id);
  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  if (!id) {
    res.status(400).json({ error: "Invalid document id", data: null });
    return;
  }

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid document id", data: null });
    return;
  }

  const { error: validationError, data: updateData } = validateDocumentInput(req.body, false);

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

    const ownsLinkedApplication = await verifyLinkedApplicationOwnership(
      updateData.linkedApplicationId,
      authenticatedUserId
    );

    if (!ownsLinkedApplication) {
      res.status(404).json({ error: "Linked application was not found", data: null });
      return;
    }

    const result = await documentModel.findOneAndUpdate(
      { _id: id, createdBy: authenticatedUserId },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!result) {
      res.status(404).json({ error: `Cannot update document with id=${id}`, data: null });
      return;
    }

    res.status(200).json({ error: null, data: result });
  } catch (error) {
    res.status(500).json({ error: "Error updating document by id", data: null });
  } finally {
    await disconnect();
  }
}

export async function deleteDocumentById(
  req: Request,
  res: Response
): Promise<void> {
  const id = getParamValue(req.params.id);
  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  if (!id) {
    res.status(400).json({ error: "Invalid document id", data: null });
    return;
  }

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid document id", data: null });
    return;
  }

  try {
    await connect();

    const result = await documentModel.findOneAndDelete({
      _id: id,
      createdBy: authenticatedUserId,
    });

    if (!result) {
      res.status(404).json({ error: `Cannot delete document with id=${id}`, data: null });
      return;
    }

    res.status(200).json({ error: null, data: true });
  } catch (error) {
    res.status(500).json({ error: "Error deleting document by id", data: null });
  } finally {
    await disconnect();
  }
}
