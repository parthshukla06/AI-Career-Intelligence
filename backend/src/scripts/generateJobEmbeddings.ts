import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Job } from "../models/Job";
import { generateJobEmbedding } from "../services/embedding.service";

dotenv.config();

const generateJobEmbeddings = async (): Promise<void> => {
  const force = process.argv.includes("--force");
  let successCount = 0;
  let skippedCount = 0;
  let failureCount = 0;

  try {
    await connectDB();
    const jobs = await Job.find({ isActive: true }).select("+embedding");

    for (const job of jobs) {
      if (!force && job.embedding?.length) {
        skippedCount += 1;
        continue;
      }

      try {
        job.embedding = await generateJobEmbedding(job);
        await job.save();
        successCount += 1;
      } catch (error) {
        failureCount += 1;
        console.error("Job embedding generation failed", {
          jobId: String(job._id),
          errorType: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message.slice(0, 300) : "Unknown error",
        });
      }
    }

    console.log("Job embedding generation complete", { successCount, skippedCount, failureCount });
    if (failureCount) process.exitCode = 1;
  } catch (error) {
    console.error("Job embedding generation failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
};

generateJobEmbeddings();