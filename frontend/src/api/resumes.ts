import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { IResume, ResumeUploadData } from "@/types/resume";

/**
 * POST /api/resumes/upload
 *
 * Sends the PDF as multipart/form-data with field name "resume".
 */
export async function uploadResume(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ResumeUploadData> {
  const formData = new FormData();

  formData.append("resume", file);

  const { data } = await apiClient.post<ApiResponse<ResumeUploadData>>(
    "/api/resumes/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      },
    },
  );

  if (!data.success || !data.data) {
    throw new Error(data.message ?? "Upload failed");
  }

  return data.data;
}

/**
 * GET /api/resumes/me
 *
 * Fetches the latest completed resume belonging to
 * the currently authenticated user.
 */
export async function getMyResume(): Promise<IResume> {
  const { data } = await apiClient.get<ApiResponse<IResume>>(
    "/api/resumes/me",
  );

  if (!data.success || !data.data) {
    throw new Error(data.message ?? "Resume not found");
  }

  return data.data;
}

/**
 * GET /api/resumes/:id
 *
 * Fetches a previously uploaded resume document by ID.
 * The backend verifies that the resume belongs to
 * the currently authenticated user.
 */
export async function getResume(id: string): Promise<IResume> {
  const { data } = await apiClient.get<ApiResponse<IResume>>(
    `/api/resumes/${id}`,
  );

  if (!data.success || !data.data) {
    throw new Error(data.message ?? "Resume not found");
  }

  return data.data;
}