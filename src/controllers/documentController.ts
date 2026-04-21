import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { documentModel } from "../models/documentModel";
import { connect, disconnect } from "../../repository/db";

const validDocumentTypes = ["cv", "cover_letter"];

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
  data: Record<string, unknown>,
  requireAllFields: boolean
): string | null => {
  if (requireAllFields || data.title !== undefined) {
    if (typeof data.title !== "string" || data.title.trim().length < 2) {
      return "title is required";
    }
  }

  if (requireAllFields || data.content !== undefined) {
    if (typeof data.content !== "string" || data.content.trim().length < 1) {
      return "content is required";
    }
  }

  if (requireAllFields || data.type !== undefined) {
    if (typeof data.type !== "string" || !validDocumentTypes.includes(data.type)) {
      return "type must be either cv or cover_letter";
    }
  }

  return null;
};

export async function createDocument(
  req: Request,
  res: Response
): Promise<void> {
  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  const validationError = validateDocumentInput(req.body, true);

  if (validationError) {
    res.status(400).json({ error: validationError, data: null });
    return;
  }

  try {
    await connect();

    const { createdBy: _ignoredCreatedBy, ...data } = req.body;
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
  const id = req.params.id;
  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
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
  const id = req.params.id;
  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
    return;
  }

  const validationError = validateDocumentInput(req.body, false);

  if (validationError) {
    res.status(400).json({ error: validationError, data: null });
    return;
  }

  try {
    await connect();

    const { createdBy: _ignoredCreatedBy, ...updateData } = req.body;
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
  const id = req.params.id;
  const authenticatedUserId = getAuthenticatedUserIdOrRespond(req, res);

  if (!authenticatedUserId) {
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
