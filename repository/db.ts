import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connect(): Promise<typeof mongoose> {
    if (!process.env.DBHOST) {
        throw new Error("DBHOST is not defined in environment variables");
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = mongoose.connect(process.env.DBHOST)
        .then(async (mongooseInstance) => {
            if (!mongoose.connection.db) {
                throw new Error("Database connection is not established");
            }

            await mongoose.connection.db.admin().command({ ping: 1 });
            console.log("Connected successfully to the database");
            return mongooseInstance;
        })
        .catch((error: unknown) => {
            connectionPromise = null;
            throw error;
        });

    return connectionPromise;
}

export async function disconnect(): Promise<void> {
    if (mongoose.connection.readyState === 0) {
        connectionPromise = null;
        return;
    }
}

export async function disconnectOnShutdown(): Promise<void> {
    if (mongoose.connection.readyState === 0) {
        connectionPromise = null;
        return;
    }

    await mongoose.disconnect();
    connectionPromise = null;
    console.log("Disconnected successfully from the database");
}
