import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { getRecommendations } from "@/api/recommendations";
import { useAuthStore } from "@/store/authStore";

function scoreClass(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

function scoreBarClass(score: number) {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function SkillBadge({
  children,
  type = "matched",
}: {
  children: React.ReactNode;
  type?: "matched" | "missing";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        type === "matched"
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {children}
    </span>
  );
}

function ScoreRow({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{score}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${scoreBarClass(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function RecommendationsPage() {
  const resumeId = useAuthStore((state) => state.resumeId);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["recommendations", resumeId],
    queryFn: () => getRecommendations(resumeId!, 10),
    enabled: Boolean(resumeId),
  });

  if (!resumeId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          <BriefcaseBusiness className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

          <h1 className="text-2xl font-bold">
            Upload your resume first
          </h1>

          <p className="mt-2 text-muted-foreground">
            Analyze your resume to get personalized job recommendations.
          </p>

          <Link
            to="/resume"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Analyze Resume
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-72 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-muted" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border bg-card p-6"
            >
              <div className="h-6 w-2/3 rounded bg-muted" />
              <div className="mt-3 h-4 w-1/2 rounded bg-muted" />
              <div className="mt-6 h-20 rounded bg-muted" />
              <div className="mt-6 h-4 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />

          <h1 className="text-xl font-bold text-red-800">
            Unable to load recommendations
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error instanceof Error
              ? error.message
              : "Something went wrong while loading your recommendations."}
          </p>

          <button
            onClick={() => refetch()}
            className="mt-6 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const recommendations = data?.data?.recommendations ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          AI Career Intelligence
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Your Job Recommendations
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Jobs ranked according to your resume, skills, experience, role fit,
          and semantic similarity.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

          <h2 className="text-xl font-semibold">
            No recommendations found
          </h2>

          <p className="mt-2 text-muted-foreground">
            Try analyzing an updated resume with more skills and experience.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="rounded-full border bg-card px-4 py-2 text-sm">
              <span className="font-semibold">
                {recommendations.length}
              </span>{" "}
              recommendations
            </div>

            <div className="rounded-full border bg-card px-4 py-2 text-sm">
              Top match:{" "}
              <span className="font-semibold">
                {recommendations[0].matchScore}%
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {recommendations.map((job, index) => (
              <article
                key={job.jobId}
                className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        #{index + 1}
                      </span>

                      {index === 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <TrendingUp className="h-3 w-3" />
                          Best Match
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold">
                      {job.title}
                    </h2>

                    <p className="mt-1 font-medium text-muted-foreground">
                      {job.company}
                    </p>
                  </div>

                  <div className="shrink-0 text-center">
                    <div
                      className={`text-3xl font-bold ${scoreClass(
                        job.matchScore
                      )}`}
                    >
                      {job.matchScore}%
                    </div>

                    <div className="text-xs text-muted-foreground">
                      match
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <BriefcaseBusiness className="h-4 w-4" />
                    {job.workMode}
                  </span>
                </div>

                <div className="mt-6 space-y-4 rounded-xl bg-muted/40 p-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Target className="h-4 w-4" />
                    Match Breakdown
                  </div>

                  <ScoreRow
                    label="Skills"
                    score={job.skillMatchScore}
                  />

                  <ScoreRow
                    label="Semantic Similarity"
                    score={job.semanticSimilarityScore}
                  />

                  <ScoreRow
                    label="Experience"
                    score={job.experienceMatchScore}
                  />

                  <ScoreRow
                    label="Role Fit"
                    score={job.roleMatchScore}
                  />
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Matched Skills
                  </div>

                  {job.matchedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {job.matchedSkills.map((skill) => (
                        <SkillBadge key={skill}>
                          {skill}
                        </SkillBadge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No required skills matched.
                    </p>
                  )}
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Missing Required Skills
                  </div>

                  {job.missingRequiredSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {job.missingRequiredSkills.map((skill) => (
                        <SkillBadge key={skill} type="missing">
                          {skill}
                        </SkillBadge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      You meet all required skills.
                    </p>
                  )}
                </div>

                {(job.matchedPreferredSkills.length > 0 ||
                  job.missingPreferredSkills.length > 0) && (
                  <div className="mt-5 border-t pt-5">
                    <div className="mb-2 text-sm font-semibold">
                      Preferred Skills
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.matchedPreferredSkills.map((skill) => (
                        <SkillBadge key={`matched-${skill}`}>
                          {skill}
                        </SkillBadge>
                      ))}

                      {job.missingPreferredSkills.map((skill) => (
                        <SkillBadge
                          key={`missing-${skill}`}
                          type="missing"
                        >
                          {skill}
                        </SkillBadge>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
