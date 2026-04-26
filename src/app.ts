import express, {Application, Request, Response} from 'express';
import dotenvFlow from 'dotenv-flow';
import routes from './routes';
import {testConnection} from '../repository/db';
import test from 'node:test';
import cors from 'cors';
import { setupDocs } from './util/documentation';
import path from 'path';


dotenvFlow.config();
//dotenvFlow.config();

//create express application
const app: Application = express();

//cors handling

function setupCors(){
    const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

    app.use(cors({
        origin: allowedOrigin,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['auth-token', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
        credentials: true
    }));
}



// APPLY CORS BEFORE anything else
setupCors();

//middleware to parse JSON request bodies
app.use(express.json());

// serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// routes AFTER cors
app.use('/api', routes);

export function startServer(){

    //setup documentation
    setupDocs(app);

   testConnection();
const PORT: number = parseInt(process.env.PORT as string) || 4000;
    app.listen(PORT, function(){
        console.log("Server is up and running on port:" + PORT);
    });
  
}