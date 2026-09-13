import mongoose, { Schema, type Model } from "mongoose";

export interface IKnowledgeChunk {
  title: string;
  category: string;
  content: string;
  source: string;
  chunkIndex: number;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    chunkIndex: { type: Number, required: true, min: 0 },
    embedding: { type: [Number], default: undefined, select: false },
  },
  { timestamps: true },
);

knowledgeChunkSchema.index({ source: 1, title: 1, chunkIndex: 1 }, { unique: true });

const existingKnowledgeChunkModel = mongoose.models.KnowledgeChunk as Model<IKnowledgeChunk> | undefined;

export const KnowledgeChunk: Model<IKnowledgeChunk> = existingKnowledgeChunkModel || mongoose.model<IKnowledgeChunk>("KnowledgeChunk", knowledgeChunkSchema);
