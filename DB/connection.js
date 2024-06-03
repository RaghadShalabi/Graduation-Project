import mongoose from "mongoose";

const connectDB = async (req, res) => {
    return await mongoose.connect(process.env.DB_LOCAL)
        .then(() => {
            console.log(`MongoDB Connected...`);
        })
        .catch((error) => {
            console.log(`Error connecting to MongoDB:${error}`);
        })
}
export default connectDB;