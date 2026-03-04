import express, {Application, Request, Response} from 'express';
import dotenvFlow from 'dotenv-flow';
import routes from './routes';
import {testConnection} from '../repository/db';
import test from 'node:test';
import cors from 'cors';


dotenvFlow.config();
//dotenvFlow.config();

//create express application
const app: Application = express();

//cors handling

function setupCors(){
    app.use(cors({
        //Allow request from any origin
        origin: "*",

        //allow methods
        methods: 'GET, POST, PUT, DELETE',

        //allow headers
        allowedHeaders: ['auth-token', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept' ],

        //allow credentials
        credentials: true
    }));
}





//middleware to parse JSON request bodies
app.use(express.json());

app.use('/api', routes);

export function startServer(){

    //setup CORS
    setupCors();

   testConnection();
const PORT: number = parseInt(process.env.PORT as string) || 4000;
    app.listen(PORT, function(){
        console.log("Server is up and running on port:" + PORT);
    });
  
}