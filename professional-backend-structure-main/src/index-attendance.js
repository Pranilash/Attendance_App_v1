import dotenv from "dotenv";
import mongoose from "mongoose";
import { app } from "./app-attendance.js";

// Load environment variables
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 5000;

// Database connection
const connectDB = async () => {
  try {
    // Use MONGODB_URI directly as it already contains the database name
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);

    console.log(
      "MongoDB Connected! Host: " + connectionInstance.connection.host
    );

    return connectionInstance;
  } catch (error) {
    console.error("MongoDB connection FAILED: " + error.message);
    process.exit(1);
  }
};

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server is running on port: " + PORT);
      console.log("Environment: " + (process.env.NODE_ENV || "development"));
      console.log("");
      console.log("API Endpoints:");
      console.log("  Health: http://localhost:" + PORT + "/health");
      console.log("  Auth:   http://localhost:" + PORT + "/api/v1/auth");
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed: " + err);
  });