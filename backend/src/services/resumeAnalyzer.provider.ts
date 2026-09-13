import { CandidateProfile } from "../types/candidateProfile";

export interface ResumeAnalyzerProvider {
  getModel(): string;
  analyze(extractedText: string): Promise<unknown>;
}

export type ResumeAnalysisErrorKind = "configuration" | "provider" | "validation";

export class ResumeAnalysisError extends Error {
  constructor(public readonly kind: ResumeAnalysisErrorKind) {
    super(kind === "configuration" ? "Groq API key is not configured" : "Resume analysis failed");
  }
}

export type ValidatedResumeAnalysis = CandidateProfile;