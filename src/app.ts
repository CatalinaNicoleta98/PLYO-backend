import express, {Application, Request, Response} from 'express';
import dotenvFlow from 'dotenv-flow';

import test from 'node:test';


dotenvFlow.config();
//dotenvFlow.config();

//create express application
const app: Application = express();

export function startServer(){

   
const PORT: number = parseInt(process.env.PORT as string) || 4000;
    app.listen(PORT, function(){
        console.log("Server is up and running on port:" + PORT);
    });
  
}