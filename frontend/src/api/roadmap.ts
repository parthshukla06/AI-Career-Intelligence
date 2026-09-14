import { apiClient } from "./client";
import type { RoadmapResponse } from "@/types/roadmap";

export async function getCareerRoadmap(
  resumeId: string
): Promise<RoadmapResponse> {
  const { data } = await apiClient.get<RoadmapResponse>(
    `/api/career-assistant/roadmap/${resumeId}`
  );

  return data;
}
