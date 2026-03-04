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
    res.status(400).send({ error: "createdBy is required" });
    return;
  }

  try {
    await connect();

    const application = new applicationModel(data);
    const result = await application.save();

    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ error: "Error creating application entry" });
  } finally {
    await disconnect();
  }
}

