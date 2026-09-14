import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { getJobById, saveJob, unsaveJob, applyToJob, submitJobFeedback } from "@/api/jobs";
import { useAuthStore } from "@/store/authStore";
import { ErrorState } from "@/components/common/ErrorState";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APPLICATION_STATUSES } from "@/types/jobs";
import type { ApplicationStatus } from "@/types/jobs";

// ── Label maps ────────────────────────────────────────────────────────────────

const WORK_MODE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  intern: "Intern",
  entry: "Entry",
  mid: "Mid",
  senior: "Senior",
  lead: "Lead",
  manager: "Manager",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
};

function formatSalary(min?: number, max?: number, currency = "INR"): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 100_000
      ? `${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)}L`
      : n >= 1_000
        ? `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
        : String(n);
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)} / yr`;
  if (min) return `${currency} ${fmt(min)}+ / yr`;
  return `Up to ${currency} ${fmt(max!)} / yr`;
}

// ── Error helpers ─────────────────────────────────────────────────────────────

function mapActionError(error: unknown, action: string): string {
  if (!axios.isAxiosError(error)) return `${action} failed. Please try again.`;
  const status = error.response?.status;
  if (status === 401) return "You must be signed in to do that.";
  if (status === 409) return "Already saved / applied.";
  if (status === 404) return "Job no longer available.";
  if (status === 429) return "Too many requests. Please wait a moment.";
  return (error.response?.data as { message?: string })?.message ?? `${action} failed.`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const isLoggedIn = !!token;
  const qc = useQueryClient();

  // ── data fetch ───────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["job", id],
    queryFn: () => getJobById(id!),
    enabled: !!id,
    retry: 1,
    staleTime: 1000 * 60 * 10,
  });

  const job = data?.data;

  // ── local UI state ────────────────────────────────────────────────────────────
  const [isSaved, setIsSaved] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<"interested" | "not_interested" | null>(null);

  // ── save job mutation ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => (isSaved ? unsaveJob(id!) : saveJob(id!)),
    onSuccess: () => {
      setIsSaved((prev) => !prev);
      toast.success(isSaved ? "Removed from saved jobs" : "Job saved");
    },
    onError: (err) => toast.error(mapActionError(err, "Save")),
  });

  // ── apply mutation ────────────────────────────────────────────────────────────
  const applyMutation = useMutation({
    mutationFn: (status: ApplicationStatus) => applyToJob(id!, status),
    onSuccess: (_data, status) => {
      setApplicationStatus(status);
      toast.success(`Marked as "${status}"`);
      // Invalidate dashboard query so counts are fresh
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(mapActionError(err, "Apply")),
  });

  // ── feedback mutation ─────────────────────────────────────────────────────────
  const feedbackMutation = useMutation({
    mutationFn: (value: "interested" | "not_interested") =>
      submitJobFeedback(id!, value),
    onSuccess: (_data, value) => {
      setFeedbackGiven(value);
      toast.success(value === "interested" ? "Marked as interested" : "Marked as not interested");
    },
    onError: (err) => toast.error(mapActionError(err, "Feedback")),
  });

  // ── states ────────────────────────────────────────────────────────────────────

  if (!id) {
    return <ErrorState message="Invalid job link." />;
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Jobs
          </Link>
        </div>
        <div className="space-y-4 max-w-3xl">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={6} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div>
        <div className="mb-4">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Jobs
          </Link>
        </div>
        <ErrorState
          message="Could not load this job. It may no longer be available."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);
  const expRange =
    job.minExperience === job.maxExperience
      ? `${job.minExperience} year${job.minExperience !== 1 ? "s" : ""}`
      : `${job.minExperience}–${job.maxExperience} years`;
  const anyActionLoading =
    saveMutation.isPending || applyMutation.isPending || feedbackMutation.isPending;

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <div className="mb-4">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
      </div>

      {/* Header card */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight">{job.title}</h1>
              <div className="mt-1.5 flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="font-medium text-foreground">{job.company}</span>
              </div>
            </div>
            <Badge
              variant={
                job.workMode === "remote"
                  ? "default"
                  : job.workMode === "hybrid"
                    ? "secondary"
                    : "outline"
              }
              className="shrink-0"
            >
              {WORK_MODE_LABELS[job.workMode] ?? job.workMode}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{expRange} exp</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              <span>{EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}</span>
            </div>
            {salary && (
              <div className="font-semibold text-foreground">{salary}</div>
            )}
          </div>

          {/* Level + industry badges */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground">
              {EXPERIENCE_LEVEL_LABELS[job.experienceLevel] ?? job.experienceLevel}
            </span>
            <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground">
              {job.industry}
            </span>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-2">
            {isLoggedIn ? (
              <>
                {/* Save / Unsave */}
                <Button
                  variant={isSaved ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={anyActionLoading}
                >
                  {isSaved ? (
                    <BookmarkCheck className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isSaved ? "Saved" : "Save job"}
                </Button>

                {/* Apply with status picker */}
                {applicationStatus ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Tracked as &ldquo;{applicationStatus}&rdquo;
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <select
                      id="apply-status"
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      defaultValue="applied"
                      disabled={anyActionLoading}
                      onChange={(e) =>
                        applyMutation.mutate(e.target.value as ApplicationStatus)
                      }
                      aria-label="Track application status"
                    >
                      <option value="" disabled>
                        Track as…
                      </option>
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Feedback */}
                {feedbackGiven ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                    {feedbackGiven === "interested" ? (
                      <ThumbsUp className="h-3.5 w-3.5" />
                    ) : (
                      <ThumbsDown className="h-3.5 w-3.5" />
                    )}
                    Feedback sent
                  </span>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Interested"
                      onClick={() => feedbackMutation.mutate("interested")}
                      disabled={anyActionLoading}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Not interested"
                      onClick={() => feedbackMutation.mutate("not_interested")}
                      disabled={anyActionLoading}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Sign in to save or track this job
              </Button>
            )}

            {/* External link */}
            {job.sourceUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  View original
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job description */}
      {job.jobDescription && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">About the role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {job.jobDescription}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Responsibilities */}
      {job.responsibilities.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {job.responsibilities.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Qualifications */}
      {job.qualifications.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Qualifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {job.qualifications.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {job.education && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{job.education}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {(job.requiredSkills.length > 0 || job.preferredSkills.length > 0) && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.requiredSkills.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Required
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {job.preferredSkills.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Preferred
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {job.preferredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded border border-dashed border-border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Source */}
      <p className="mt-2 text-xs text-muted-foreground">
        Source: {job.source}
      </p>
    </div>
  );
}
