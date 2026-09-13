import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { KnowledgeChunk } from "../models/KnowledgeChunk";
import { generateEmbedding } from "../services/embedding.service";
import { KNOWLEDGE_SOURCE, loadKnowledgeChunks } from "../services/rag.service";

dotenv.config();

const generateKnowledgeEmbeddings = async (): Promise<void> => {
  let successCount = 0;
  let failureCount = 0;
  try {
    await connectDB();
    for (const chunk of loadKnowledgeChunks()) {
      try {
        const embedding = await generateEmbedding(chunk.content);
        await KnowledgeChunk.updateOne(
          { source: KNOWLEDGE_SOURCE, title: chunk.title, chunkIndex: chunk.chunkIndex },
          { $set: { ...chunk, embedding } },
          { upsert: true },
        );
        successCount += 1;
      } catch (error) {
        failureCount += 1;
        console.error("Knowledge embedding generation failed", {
          title: chunk.title,
          chunkIndex: chunk.chunkIndex,
          errorType: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message.slice(0, 300) : "Unknown error",
        });
      }
    }
    console.log("Knowledge embedding generation complete", { successCount, failureCount });
    if (failureCount) process.exitCode = 1;
  } catch (error) {
    console.error("Knowledge embedding generation failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
};

generateKnowledgeEmbeddings();
