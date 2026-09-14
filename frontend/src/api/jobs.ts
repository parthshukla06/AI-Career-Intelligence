import { apiClient } from "./client";
import type {
  JobFilters,
  JobsListResponse,
  JobDetailResponse,
  ApplicationStatus,
  JobFeedbackValue,
} from "@/types/jobs";

// ── GET /api/jobs ─────────────────────────────────────────────────────────────

export async function getJobs(filters: JobFilters = {}): Promise<JobsListResponse> {
  const params: Record<string, string> = {};
  if (filters.title?.trim()) params.title = filters.title.trim();
  if (filters.industry?.trim()) params.industry = filters.industry.trim();
  if (filters.experienceLevel) params.experienceLevel = filters.experienceLevel;
  if (filters.workMode) params.workMode = filters.workMode;
  if (filters.location?.trim()) params.location = filters.location.trim();
  if (filters.skills?.trim()) params.skills = filters.skills.trim();

  const { data } = await apiClient.get<JobsListResponse>("/api/jobs", { params });
  return data;
}

// ── GET /api/jobs/:id ─────────────────────────────────────────────────────────

export async function getJobById(id: string): Promise<JobDetailResponse> {
  const { data } = await apiClient.get<JobDetailResponse>(`/api/jobs/${id}`);
  return data;
}

// ── POST /api/users/me/saved-jobs/:jobId ──────────────────────────────────────

export async function saveJob(jobId: string): Promise<void> {
  await apiClient.post(`/api/users/me/saved-jobs/${jobId}`);
}

// ── DELETE /api/users/me/saved-jobs/:jobId ────────────────────────────────────

export async function unsaveJob(jobId: string): Promise<void> {
  await apiClient.delete(`/api/users/me/saved-jobs/${jobId}`);
}

// ── POST /api/users/me/applications ───────────────────────────────────────────

export async function applyToJob(jobId: string, status: ApplicationStatus): Promise<void> {
  await apiClient.post("/api/users/me/applications", { jobId, status });
}

// ── POST /api/users/me/job-feedback/:jobId ────────────────────────────────────

export async function submitJobFeedback(
  jobId: string,
  feedback: JobFeedbackValue,
): Promise<void> {
  await apiClient.post(`/api/users/me/job-feedback/${jobId}`, { feedback });
}
