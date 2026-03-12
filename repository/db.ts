import mongoose from "mongoose";

export async function testConnection(){
    try {
        await connect();
        await disconnect();
        console.log("Database connection test successful(connect and disconnect)");
    }catch(error){
        console.log("Database connection test failed:" + error);

    }
}



export async function connect(){

    try {
        if(!process.env.DBHOST){
            throw new Error("DBHOST is not defined in environment variables");  
        }
        await mongoose.connect(process.env.DBHOST);

        if(mongoose.connection.db){
            await mongoose.connection.db.admin().command({ping: 1});
            console.log("Connected successfully to the database");
        }else{
            throw new Error("Database connection is not established");
        }

    }catch (error){
        console.log("Error connecting to the database:" + error);
    }
};


export async function disconnect(){
    try {
        await mongoose.disconnect();
        console.log("Disconnected successfully from the database");

    }catch (error){
        console.log("Error disconnecting from the database:" + error);
    }
}