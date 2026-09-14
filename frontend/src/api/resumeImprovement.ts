import { apiClient } from "./client";
import type { ChatResponse } from "@/types/careerAssistant";

export async function getResumeImprovement(
  resumeId: string
): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>(
    `/api/career-assistant/resume-improvement/${resumeId}`
  );

  return data;
}
