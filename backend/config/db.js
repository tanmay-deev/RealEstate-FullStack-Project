import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect("mongodb+srv://tanmaybonde20_db_user:tanmay2006@cluster0.vf0axal.mongodb.net/RealState").then(() => {
        console.log("DB Connected"); 
    });
}