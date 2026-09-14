import { apiClient } from "./client";
import type { CareerPathsResponse } from "@/types/careerPaths";

export async function getCareerPaths(
  resumeId: string
): Promise<CareerPathsResponse> {
  const { data } = await apiClient.get<CareerPathsResponse>(
    `/api/career-assistant/career-paths/${resumeId}`
  );

  return data;
}
