import fs from "fs";
import path from "path";
import { generateEmbedding } from "./embedding.service";
import { cosineSimilarity } from "../utils/vector.util";

export const KNOWLEDGE_SOURCE = "internal-career-knowledge-base";

export interface KnowledgeChunkResult {
  title: string;
  category: string;
  source: string;
  chunkIndex: number;
  content: string;
  score: number;
}

const knowledgeDirectory = path.resolve(__dirname, "../../data/knowledge");

export const chunkKnowledgeContent = (filename: string, content: string): Omit<KnowledgeChunkResult, "score">[] => {
  const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(filename, path.extname(filename));
  const category = path.basename(filename, path.extname(filename)).toLowerCase();
  const paragraphs = content
    .replace(/^#\s+.+$/m, "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const chunks: Omit<KnowledgeChunkResult, "score">[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current && `${current} ${paragraph}`.length > 1200) {
      chunks.push({ title, category, source: KNOWLEDGE_SOURCE, chunkIndex: chunks.length, content: current });
      current = "";
    }
    current = current ? `${current} ${paragraph}` : paragraph;
  }
  if (current) chunks.push({ title, category, source: KNOWLEDGE_SOURCE, chunkIndex: chunks.length, content: current });
  return chunks;
};

export const loadKnowledgeChunks = (): Omit<KnowledgeChunkResult, "score">[] => {
  if (!fs.existsSync(knowledgeDirectory)) return [];
  return fs.readdirSync(knowledgeDirectory)
    .filter((filename) => filename.toLowerCase().endsWith(".md"))
    .sort()
    .flatMap((filename) => chunkKnowledgeContent(filename, fs.readFileSync(path.join(knowledgeDirectory, filename), "utf8")));
};

let indexedKnowledgePromise: Promise<Array<Omit<KnowledgeChunkResult, "score"> & { embedding: number[] }>> | undefined;

const getIndexedKnowledge = (): Promise<Array<Omit<KnowledgeChunkResult, "score"> & { embedding: number[] }>> => {
  indexedKnowledgePromise ??= Promise.all(loadKnowledgeChunks().map(async (chunk) => ({ ...chunk, embedding: await generateEmbedding(chunk.content) })));
  return indexedKnowledgePromise;
};

export const retrieveKnowledge = async (query: string, limit = 4): Promise<KnowledgeChunkResult[]> => {
  const chunks = await getIndexedKnowledge();
  const queryEmbedding = await generateEmbedding(query);
  return chunks
    .map((chunk) => ({ ...chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) ?? 0 }))
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.max(0, limit))
    .map(({ embedding: _embedding, ...chunk }) => chunk);
};

export const clearKnowledgeIndexCache = (): void => {
  indexedKnowledgePromise = undefined;
};
