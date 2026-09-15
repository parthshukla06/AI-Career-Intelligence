import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import {
  uploadResume,
  getResume,
  getMyResume,
  deleteMyResume,
} from "@/api/resumes";
import { useAuthStore } from "@/store/authStore";
import { queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ResumeDropzone } from "@/components/resume/ResumeDropzone";
import { CandidateProfileView } from "@/components/resume/CandidateProfileView";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { ErrorState } from "@/components/common/ErrorState";
import type { ResumeUploadData } from "@/types/resume";

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

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(
    undefined,
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [freshUpload, setFreshUpload] = useState<ResumeUploadData | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Restore user's resume after login/logout/login.
  const {
    data: myResume,
    isLoading: isLoadingMyResume,
    isError: isMyResumeError,
  } = useQuery({
    queryKey: ["my-resume"],
    queryFn: getMyResume,
    enabled: !resumeId && !freshUpload && !isUploading && !isReplacing,
    retry: false,
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (myResume?._id && !resumeId) {
      setResumeId(String(myResume._id));
    }
  }, [myResume, resumeId, setResumeId]);

  // Fetch resume when its ID is already available.
  const {
    data: fetchedResume,
    isLoading: isLoadingExisting,
    isError: isErrorExisting,
    refetch: refetchExisting,
  } = useQuery({
    queryKey: ["resume", resumeId],
    queryFn: () => getResume(resumeId!),
    enabled: !!resumeId && !freshUpload && !isUploading && !isReplacing,
    retry: 1,
    staleTime: 1000 * 60 * 10,
  });

  // Upload new resume.
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setServerError(null);

    try {
      const result = await uploadResume(file, (percent) => {
        setUploadProgress(percent);
      });

      setResumeId(result.id);
      setFreshUpload(result);

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

  // Replace resume:
  // 1. Delete old resume from backend
  // 2. Clear local state/cache
  // 3. Show upload screen
  const handleReplaceResume = async () => {
    if (isReplacing) return;

    setIsReplacing(true);
    setServerError(null);

    try {
      await deleteMyResume();

      if (resumeId) {
        queryClient.removeQueries({
          queryKey: ["resume", resumeId],
        });
      }

      queryClient.removeQueries({
        queryKey: ["my-resume"],
      });

      setResumeId(null);
      setFreshUpload(null);

      toast.success("Previous resume removed. Upload your new resume.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string })?.message;

        setServerError(
          message ?? "Unable to remove your previous resume. Please try again.",
        );
      } else {
        setServerError("Unable to remove your previous resume. Please try again.");
      }
    } finally {
      setIsReplacing(false);
    }
  };

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

  // Loading saved resume.
  if (!resumeId && isLoadingMyResume && !isReplacing) {
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

  // No resume — show upload screen.
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

  // Uploading.
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

  // Loading existing resume.
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

  // Existing resume fetch failed.
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
            disabled={isReplacing}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {isReplacing ? "Removing..." : "Upload a new resume"}
          </Button>
        </div>
      </div>
    );
  }

  // Profile loaded.
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
              disabled={isReplacing}
            >
              <RefreshCw
                className={`mr-2 h-3.5 w-3.5 ${
                  isReplacing ? "animate-spin" : ""
                }`}
              />
              {isReplacing ? "Removing..." : "Replace resume"}
            </Button>
          }
        />

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

  // Fallback.
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