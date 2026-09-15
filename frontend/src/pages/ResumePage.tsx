import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { uploadResume, getResume, getMyResume } from "@/api/resumes";
import { useAuthStore } from "@/store/authStore";
import { queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ResumeDropzone } from "@/components/resume/ResumeDropzone";
import { CandidateProfileView } from "@/components/resume/CandidateProfileView";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { ErrorState } from "@/components/common/ErrorState";
import type { ResumeUploadData } from "@/types/resume";

/**
 * Map backend HTTP status codes to user-friendly messages.
 */
function mapUploadError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Unable to reach the server. Check your connection and try again.";
  }

  const status = error.response?.status;
  const serverMessage = (error.response?.data as { message?: string })?.message;

  switch (status) {
    case 400:
      return serverMessage ?? "Invalid file. Please select a valid PDF.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 413:
      return "The file is too large. Please upload a PDF smaller than 5 MB.";
    case 422:
      return (
        serverMessage ??
        "Could not extract text from this PDF. Try a text-based PDF rather than a scanned image."
      );
    case 429:
      return "Too many upload requests. Please wait a moment and try again.";
    case 502:
      return "Resume analysis could not be completed right now. Please try again in a moment.";
    case 503:
      return "AI resume analysis is temporarily unavailable (API key not configured). Contact the platform administrator.";
    case 500:
      return "A server error occurred. Please try again.";
    default:
      return serverMessage ?? "Upload failed. Please try again.";
  }
}

export function ResumePage() {
  const { resumeId, setResumeId } = useAuthStore();

  // ── upload state ────────────────────────────────────────────────────────────
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(
    undefined,
  );
  const [serverError, setServerError] = useState<string | null>(null);

  // Hold the result from a fresh upload so we skip the GET request
  // in the same session.
  const [freshUpload, setFreshUpload] = useState<ResumeUploadData | null>(null);

  // ── Restore resume from backend when no resumeId exists ─────────────────────
  //
  // This is what makes:
  // logout → login again → resume automatically return
  //
  // The backend identifies the resume using the authenticated user's JWT.
  const {
    data: myResume,
    isLoading: isLoadingMyResume,
    isError: isMyResumeError,
  } = useQuery({
    queryKey: ["my-resume"],
    queryFn: getMyResume,
    enabled: !resumeId && !freshUpload && !isUploading,
    retry: false,
    staleTime: 1000 * 60 * 10,
  });

  // When the backend finds the user's resume, restore its ID
  // into Zustand so the rest of the application can use it.
  useEffect(() => {
    if (myResume?._id && !resumeId) {
      setResumeId(String(myResume._id));
    }
  }, [myResume, resumeId, setResumeId]);

  // ── Fetch existing resume when resumeId is already in store ─────────────────
  const {
    data: fetchedResume,
    isLoading: isLoadingExisting,
    isError: isErrorExisting,
    refetch: refetchExisting,
  } = useQuery({
    queryKey: ["resume", resumeId],
    queryFn: () => getResume(resumeId!),
    enabled: !!resumeId && !freshUpload && !isUploading,
    retry: 1,
    staleTime: 1000 * 60 * 10,
  });

  // ── Upload handler ──────────────────────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setServerError(null);

    try {
      const result = await uploadResume(file, (percent) => {
        setUploadProgress(percent);
      });

      // Store the new resume ID.
      setResumeId(result.id);

      // Keep upload result locally so we can display it without
      // a second GET request.
      setFreshUpload(result);

      // Update "my-resume" cache with the newly uploaded resume.
      queryClient.setQueryData(["my-resume"], {
        _id: result.id,
        originalFilename: result.originalFilename,
        candidateProfile: result.candidateProfile,
        processingStatus: "completed",
        aiAnalysisStatus: "completed",
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Pre-populate the individual resume query cache.
      queryClient.setQueryData(["resume", result.id], {
        _id: result.id,
        originalFilename: result.originalFilename,
        candidateProfile: result.candidateProfile,
        processingStatus: "completed",
        aiAnalysisStatus: "completed",
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast.success("Resume analysed successfully!");
    } catch (error) {
      setServerError(mapUploadError(error));
    } finally {
      setIsUploading(false);
      setUploadProgress(undefined);
    }
  };

  // ── Replace resume ───────────────────────────────────────────────────────────
  const handleReplaceResume = () => {
    setResumeId(null);
    setFreshUpload(null);
    setServerError(null);

    if (resumeId) {
      queryClient.removeQueries({
        queryKey: ["resume", resumeId],
      });
    }

    queryClient.removeQueries({
      queryKey: ["my-resume"],
    });
  };

  // ── Derive which profile to display ─────────────────────────────────────────
  const displayData = freshUpload
    ? {
        profile: freshUpload.candidateProfile,
        filename: freshUpload.originalFilename,
        isFresh: true,
      }
    : fetchedResume?.candidateProfile
      ? {
          profile: fetchedResume.candidateProfile,
          filename: fetchedResume.originalFilename,
          isFresh: false,
        }
      : myResume?.candidateProfile
        ? {
            profile: myResume.candidateProfile,
            filename: myResume.originalFilename,
            isFresh: false,
          }
        : null;

  // ── Render states ───────────────────────────────────────────────────────────

  // 1. No resumeId — check backend for existing resume first.
  if (!resumeId && isLoadingMyResume) {
    return (
      <div>
        <PageHeader
          title="Resume"
          subtitle="Loading your saved resume profile…"
        />

        <div className="space-y-4 max-w-3xl">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={6} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  // 2. No resume found for this account — show upload dropzone.
  if (!resumeId && (isMyResumeError || !myResume)) {
    return (
      <div>
        <PageHeader
          title="Resume"
          subtitle="Upload your PDF resume for AI-powered skill extraction and career analysis."
        />

        <div className="mx-auto max-w-xl">
          <ResumeDropzone
            onUpload={handleUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            serverError={serverError}
          />
        </div>
      </div>
    );
  }

  // 3. Resume is being uploaded.
  if (isUploading) {
    return (
      <div>
        <PageHeader
          title="Resume"
          subtitle="Analysing your resume…"
        />

        <div className="mx-auto max-w-xl">
          <ResumeDropzone
            onUpload={handleUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            serverError={serverError}
          />
        </div>
      </div>
    );
  }

  // 4. Existing resume is loading.
  if (resumeId && isLoadingExisting && !displayData) {
    return (
      <div>
        <PageHeader
          title="Resume"
          subtitle="Loading your resume profile…"
        />

        <div className="space-y-4 max-w-3xl">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={6} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  // 5. Resume fetch failed.
  if (resumeId && isErrorExisting && !displayData) {
    return (
      <div>
        <PageHeader title="Resume" />

        <ErrorState
          message="Could not load your resume. It may have been deleted or the server is unavailable."
          onRetry={() => refetchExisting()}
        />

        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={handleReplaceResume}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload a new resume
          </Button>
        </div>
      </div>
    );
  }

  // 6. Profile loaded successfully.
  if (displayData) {
    return (
      <div>
        <PageHeader
          title="Resume Analysis"
          subtitle="Your AI-extracted candidate profile. This data powers your job recommendations and career intelligence."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={handleReplaceResume}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Replace resume
            </Button>
          }
        />

        {/* Success banner — only shown after a fresh upload */}
        {displayData.isFresh && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />

            <div>
              <p className="text-sm font-medium text-green-800">
                Resume successfully analysed
              </p>

              {displayData.filename && (
                <p className="text-xs text-green-700 mt-0.5">
                  {displayData.filename}
                </p>
              )}
            </div>
          </div>
        )}

        <CandidateProfileView
          profile={displayData.profile}
          filename={displayData.filename}
          className="max-w-3xl"
        />
      </div>
    );
  }

  // 7. Fallback.
  return (
    <div>
      <PageHeader title="Resume" />

      <div className="mx-auto max-w-xl">
        <ResumeDropzone
          onUpload={handleUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          serverError={serverError}
        />
      </div>
    </div>
  );
}