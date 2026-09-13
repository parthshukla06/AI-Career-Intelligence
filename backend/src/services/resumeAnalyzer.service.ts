import { CandidateProfile } from "../types/candidateProfile";
import { candidateProfileSchema } from "./resumeAnalyzer.shared";
import { ResumeAnalysisError } from "./resumeAnalyzer.provider";
import { GroqResumeAnalyzer } from "./groqResumeAnalyzer.service";

export { ResumeAnalysisError } from "./resumeAnalyzer.provider";
export { candidateProfileSchema } from "./resumeAnalyzer.shared";

const activeProvider = new GroqResumeAnalyzer();

export const getResumeAnalysisModel = (): string => activeProvider.getModel();

export const analyzeResume = async (extractedText: string): Promise<CandidateProfile> => {
  try {
    const result = candidateProfileSchema.safeParse(await activeProvider.analyze(extractedText));
    if (!result.success) throw new ResumeAnalysisError("validation");
    console.log("Groq resume analysis completed", { model: getResumeAnalysisModel() });
    return result.data;
  } catch (error) {
    if (error instanceof ResumeAnalysisError) throw error;
    throw new ResumeAnalysisError("provider");
  }
};
