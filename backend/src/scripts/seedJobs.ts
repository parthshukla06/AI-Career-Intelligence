import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Job } from "../models/Job";
import { generateJobEmbedding } from "../services/embedding.service";

dotenv.config();

type SeedJob = Record<string, unknown> & { sourceUrl: string };

const seedJobs = async (): Promise<void> => {
  try {
    await connectDB();

    const dataPath = path.resolve(__dirname, "../data/jobs.json");
    const jobs = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as SeedJob[];

    const result = await Job.bulkWrite(
      jobs.map((job) => ({
        updateOne: {
          filter: { sourceUrl: job.sourceUrl },
          update: { $set: job },
          upsert: true,
        },
      })),
    );

    console.log(
      `Job seed complete: ${result.upsertedCount} inserted, ${result.modifiedCount} updated, ${jobs.length} processed.`,
    );

    const activeJobs = await Job.find({ isActive: true }).select("+embedding");
    let embeddingsGenerated = 0;
    for (const job of activeJobs) {
      if (job.embedding?.length) continue;
      job.embedding = await generateJobEmbedding(job);
      await job.save();
      embeddingsGenerated += 1;
    }
    console.log(`Job embeddings generated: ${embeddingsGenerated}.`);
  } catch (error) {
    console.error("Job seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
};

seedJobs();
