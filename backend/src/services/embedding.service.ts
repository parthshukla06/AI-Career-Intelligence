import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import { IJob } from "../models/Job";
import { CandidateProfile } from "../types/candidateProfile";
import { candidateEmbeddingText, jobEmbeddingText } from "./embeddingText.service";

export const EMBEDDING_MODEL = "onnx-community/all-MiniLM-L6-v2-ONNX";
export const EMBEDDING_DIMENSION = 384;

export interface EmbeddingProvider {
  generate(text: string): Promise<number[]>;
}

let extractorPromise: Promise<FeatureExtractionPipeline> | undefined;

const getExtractor = (): Promise<FeatureExtractionPipeline> => {
  extractorPromise ??= pipeline("feature-extraction", EMBEDDING_MODEL) as Promise<FeatureExtractionPipeline>;
  return extractorPromise;
};

export class LocalEmbeddingProvider implements EmbeddingProvider {
  async generate(text: string): Promise<number[]> {
    const extractor = await getExtractor();
    const output = await extractor(text.slice(0, 12000), { pooling: "mean", normalize: true });
    return Array.from(output.data as ArrayLike<number>, Number);
  }
}

const provider = new LocalEmbeddingProvider();

export const generateEmbedding = (text: string): Promise<number[]> => provider.generate(text);

export const generateCandidateEmbedding = (candidate: CandidateProfile): Promise<number[]> =>
  generateEmbedding(candidateEmbeddingText(candidate));

export const generateJobEmbedding = (job: Pick<IJob, "title" | "industry" | "requiredSkills" | "preferredSkills" | "responsibilities" | "qualifications" | "jobDescription" | "experienceLevel">): Promise<number[]> =>
  generateEmbedding(jobEmbeddingText(job));