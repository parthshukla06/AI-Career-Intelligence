import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { connectDB } from "./config/db";
import { corsOrigins, NODE_ENV, validateEnvironment } from "./config/env";
import jobRoutes from "./routes/jobRoutes";
import resumeRoutes from "./routes/resume.routes";
import recommendationRoutes from "./routes/recommendation.routes";
import careerRoutes from "./routes/career.routes";
import careerAssistantRoutes from "./routes/careerAssistant.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import { aiRateLimit, authRateLimit } from "./middleware/rateLimit";

validateEnvironment();

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: corsOrigins() }));
app.use(express.json({ limit: "32kb" }));
app.use("/api/jobs", jobRoutes);
app.use("/api/resumes", aiRateLimit, resumeRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/career", careerRoutes);
app.use("/api/career-assistant", aiRateLimit, careerAssistantRoutes);
app.use("/api/auth", authRateLimit, authRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: NODE_ENV,
  });
});

app.get("/api/health/ready", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ success: ready, status: ready ? "ready" : "not_ready", database: ready ? "connected" : "disconnected" });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
  const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : 500;
  res.status(status === 413 ? 413 : status === 400 ? 400 : 500).json({ success: false, message: status === 400 ? "Invalid request" : "Internal server error" });
});

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
