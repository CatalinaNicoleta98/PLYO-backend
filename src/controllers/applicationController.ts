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

//retieves all applications from the data source

export async function getAllApplications(req: Request, res: Response) {

    try{

        await connect();

        
        const result = await applicationModel.find({});
        
        res.status(200).send(result);


    }catch (error) {

        res.status(500).send("error retrieving applications. Error: " + error);

    }finally {

        await disconnect();
    }

} 

//retrieves an application entry by id from the data source
export async function getApplicationById(req: Request, res: Response) {

    try{

        await connect();

        const id = req.params.id;

        
        const result = await applicationModel.find({_id: id});
        
        res.status(200).send(result);


    }catch (error) {

        res.status(500).send("error retrieving applications. Error: " + error);

    }finally {

        await disconnect();
    }

} 

//updates an application entry by id in the data source based on the request body
export async function updateApplicationById(req: Request, res: Response) {

    const id = req.params.id;

    try{

        await connect();

    
        const result = await applicationModel.findByIdAndUpdate(id, req.body);

        if(!result){
            res.status(404).send('Cannot update application entry with id= ' + id );
        }else{
            res.status(200).send('Application entry was updated successfully.');
        }
        

    
    }catch (error) {

        res.status(500).send("Error updating application entry by id. Error: " + error);

    }finally {

        await disconnect();
    }
}

//deletes an application entry by id from the data source
export async function deleteApplicationById(req: Request, res: Response) {

    const id = req.params.id;

    try{

        await connect();

        const result = await applicationModel.findByIdAndDelete(id);

        if(!result){
            res.status(404).send('Cannot delete application entry with id= ' + id );
        }else{
            res.status(200).send('Application entry was deleted successfully.');
        }
        

    
    }catch (error) {

        res.status(500).send("Error deleting application entry by id. Error: " + error);

    }finally {

        await disconnect();
    }

}