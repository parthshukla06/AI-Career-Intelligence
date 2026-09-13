import OpenAI from "openai";
import { candidateProfileJsonSchema, resumeExtractionInstructions } from "./resumeAnalyzer.shared";
import { ResumeAnalysisError, ResumeAnalyzerProvider } from "./resumeAnalyzer.provider";

export class OpenAIResumeAnalyzer implements ResumeAnalyzerProvider {
  getModel(): string {
    return process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async analyze(extractedText: string): Promise<unknown> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new ResumeAnalysisError("configuration");
    const model = this.getModel();

    try {
      const client = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 1 });
      const response = await client.responses.create({
        model,
        store: false,
        instructions: resumeExtractionInstructions,
        input: `Extract the candidate profile from this resume text:\n\n${extractedText}`,
        text: { format: { type: "json_schema", name: "candidate_profile", strict: true, schema: candidateProfileJsonSchema } },
      });
      if (!response.output_text) throw new ResumeAnalysisError("validation");
      return JSON.parse(response.output_text) as unknown;
    } catch (error) {
      if (error instanceof ResumeAnalysisError) throw error;
      if (error instanceof OpenAI.APIError) {
        console.error("OpenAI resume analysis request failed", { errorType: error.name, message: error.message.slice(0, 500), status: error.status, code: error.code, model });
      } else {
        console.error("OpenAI resume analysis request failed", { errorType: error instanceof Error ? error.name : "UnknownError", model });
      }
      throw new ResumeAnalysisError("provider");
    }
  }
}