import { apiClient } from "./client";
import type { RecommendationsResponse } from "@/types/recommendations";

export async function getRecommendations(
  resumeId: string,
  limit = 10
): Promise<RecommendationsResponse> {
  const { data } = await apiClient.get<RecommendationsResponse>(
    `/api/recommendations/${resumeId}`,
    {
      params: {
        limit,
      },
    }
  );

  return data;
}
