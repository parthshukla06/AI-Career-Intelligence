import { apiClient } from "./client";
import type { ChatResponse } from "@/types/careerAssistant";

export async function sendChatMessage(
  message: string,
  resumeId?: string
): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>(
    "/api/career-assistant/chat",
    {
      message,
      ...(resumeId ? { resumeId } : {}),
    }
  );

  return data;
}
