import OpenAI from "openai";
import { candidateProfileJsonSchema, resumeExtractionInstructions } from "./resumeAnalyzer.shared";
import { ResumeAnalysisError, ResumeAnalyzerProvider } from "./resumeAnalyzer.provider";

export const createGroqClient = (): OpenAI => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new ResumeAnalysisError("configuration");
  return new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1", timeout: 45_000, maxRetries: 1 });
};

export class GroqResumeAnalyzer implements ResumeAnalyzerProvider {
  getModel(): string {
    return process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  }

  async analyze(extractedText: string): Promise<unknown> {
    const model = this.getModel();

    try {
      const client = createGroqClient();
      console.log("Starting Groq resume analysis", { model });
      const response = await client.chat.completions.create({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: resumeExtractionInstructions },
          { role: "user", content: `Extract the candidate profile from this resume text:\n\n${extractedText}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "candidate_profile",
            strict: true,
            schema: candidateProfileJsonSchema,
          },
        },
      });

      const responseText = response.choices[0]?.message.content?.trim();
      if (!responseText) throw new ResumeAnalysisError("validation");
      return JSON.parse(responseText) as unknown;
    } catch (error) {
      if (error instanceof ResumeAnalysisError) throw error;
      if (error instanceof OpenAI.APIError) {
        console.error("Groq resume analysis request failed", {
          errorType: error.name,
          message: error.message.slice(0, 500),
          status: error.status,
          code: error.code,
          model,
        });
      } else {
        console.error("Groq resume analysis request failed", {
          errorType: error instanceof Error ? error.name : "UnknownError",
          model,
        });
      }
      throw new ResumeAnalysisError("provider");
    }
  }
}