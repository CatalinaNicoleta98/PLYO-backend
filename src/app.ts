import express, {Application, Request, Response} from 'express';
import dotenvFlow from 'dotenv-flow';
import routes from './routes';
import { connect, disconnectOnShutdown } from '../repository/db';
import cors from 'cors';
import { setupDocs } from './util/documentation';
import path from 'path';


dotenvFlow.config();
//dotenvFlow.config();

//create express application
const app: Application = express();

//cors handling

function setupCors() {
    const allowedOrigins = [
        "http://localhost:5173",
    ];

    if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
    }

    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                    return;
                }

                callback(new Error("Not allowed by CORS"));
            },
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            allowedHeaders: ['auth-token', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
            credentials: true,
        })
    );
}



// APPLY CORS BEFORE anything else
setupCors();

//middleware to parse JSON request bodies
app.use(express.json());

// serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// routes AFTER cors
app.use('/api', routes);

let shutdownHandlersRegistered = false;

function registerShutdownHandlers() {
    if (shutdownHandlersRegistered) {
        return;
    }

    shutdownHandlersRegistered = true;

    const gracefulShutdown = async (signal: NodeJS.Signals) => {
        try {
            await disconnectOnShutdown();
        } catch (error) {
            console.error(`Failed to disconnect from the database on ${signal}:`, error);
        } finally {
            process.exit(0);
        }
    };

    process.once('SIGINT', () => {
        void gracefulShutdown('SIGINT');
    });

    process.once('SIGTERM', () => {
        void gracefulShutdown('SIGTERM');
    });
}

export async function startServer(){

    //setup documentation
    setupDocs(app);

    await connect();
    registerShutdownHandlers();

const PORT: number = parseInt(process.env.PORT as string) || 4000;
    app.listen(PORT, function(){
        console.log("Server is up and running on port:" + PORT);
    });
  
}
