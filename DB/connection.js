import mongoose from "mongoose";

const connectDB = async (req, res) => {
  // Establish a connection to the MongoDB database
  return await mongoose
    .connect(process.env.DB_LOCAL) // Connect to the MongoDB URI specified in the environment variable DB_LOCAL
    .then(() => {
      console.log(`MongoDB Connected...`); // Log a success message if the connection is successful
    })
    .catch((error) => {
      console.log(`Error connecting to MongoDB:${error}`); // Log an error message if the connection fails
    });
};
export default connectDB; // Export the connectDB function for use in other parts of the application
