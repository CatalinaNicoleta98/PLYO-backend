import { Request, Response } from "express";
import { applicationModel } from "../models/applicationModel";
import { connect, disconnect } from "../../repository/db";

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