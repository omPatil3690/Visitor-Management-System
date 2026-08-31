import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

// Routes
import authRoutes from "./routes/auth.routes";
import visitsRoutes from "./routes/visits.routes";
import visitorsRoutes from "./routes/visitors.routes";
import hostsRoutes from "./routes/hosts.routes";
import uploadRoutes from "./routes/upload.routes";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/visits", visitsRoutes);
app.use("/api/visitors", visitorsRoutes);
app.use("/api/hosts", hostsRoutes);
app.use("/api/upload", uploadRoutes);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Server error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
    });
  },
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});
