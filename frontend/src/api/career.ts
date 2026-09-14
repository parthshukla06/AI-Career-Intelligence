import { apiClient } from "./client";
import type { CareerOverviewResponse } from "@/types/career";

export async function getCareerOverview(
  resumeId: string
): Promise<CareerOverviewResponse> {
  const { data } = await apiClient.get<CareerOverviewResponse>(
    `/api/career/${resumeId}`
  );

  return data;
}
