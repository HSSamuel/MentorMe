// src/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Import all route handlers
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import requestRoutes from "./routes/request.routes";
import sessionRoutes from "./routes/session.routes"; // Assuming you have this file for session routes
import adminRoutes from "./routes/admin.routes";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/sessions", sessionRoutes); // Use session routes
app.use("/api/admin", adminRoutes);

// Connect to MongoDB and Then Start Server
const startServer = async () => {
  if (!MONGO_URI) {
    console.error("🔴 MONGO_URI is not defined in .env file");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("🟢 MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("🔴 Could not connect to MongoDB");
    console.error(error);
    process.exit(1);
  }
};

startServer();
