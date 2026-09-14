import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  Bot,
  FileText,
  Map,
  ArrowRight,
  TrendingUp,
  Target,
  AlertTriangle,
} from "lucide-react";

import { getCareerOverview } from "@/api/career";
import { getRecommendations } from "@/api/recommendations";
import { useAuthStore } from "@/store/authStore";

export function DashboardPage() {
  const { resumeId } = useAuthStore();

  const careerQuery = useQuery({
    queryKey: ["career-overview", resumeId],
    queryFn: () => getCareerOverview(resumeId!),
    enabled: Boolean(resumeId),
  });

  const recommendationsQuery = useQuery({
    queryKey: ["recommendations", resumeId],
    queryFn: () => getRecommendations(resumeId!, 5),
    enabled: Boolean(resumeId),
  });

  if (!resumeId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome to AI Career Intelligence</h1>
          <p className="mt-2 text-muted-foreground">
            Upload your resume to unlock personalized career insights.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No resume analyzed yet</h2>
          <p className="mt-2 text-muted-foreground">
            Start by uploading your resume and let the platform analyze your career profile.
          </p>

          <Link
            to="/resume"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground"
          >
            Upload Resume
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const career = careerQuery.data?.data;
  const recommendations = recommendationsQuery.data?.data.recommendations ?? [];

  const readinessScore = career?.readiness?.score ?? 0;
  const readinessLevel = career?.readiness?.level ?? "Loading";

  const skillGaps = career?.skillGaps ?? [];
  const topRecommendation = recommendations[0];

  if (careerQuery.isLoading || recommendationsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Career Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Loading your personalized career intelligence...
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      </div>
    );
  }

  if (careerQuery.isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold">Unable to load dashboard</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please refresh the page and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Career Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your personalized career intelligence at a glance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Career Readiness
            </span>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="mt-3 text-3xl font-bold">
            {readinessScore}%
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {readinessLevel}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Job Matches
            </span>
            <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="mt-3 text-3xl font-bold">
            {recommendations.length}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Top personalized matches
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Skill Gaps
            </span>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="mt-3 text-3xl font-bold">
            {skillGaps.length}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Skills to improve
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Top Match
            </span>
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="mt-3 text-3xl font-bold">
            {topRecommendation?.matchScore ?? 0}%
          </div>

          <p className="mt-1 truncate text-sm text-muted-foreground">
            {topRecommendation?.title ?? "No match available"}
          </p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Readiness */}
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Career Readiness</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your current career preparation level.
              </p>
            </div>

            <Link
              to="/career"
              className="text-sm font-medium hover:underline"
            >
              View details
            </Link>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span>{readinessLevel}</span>
              <span className="font-semibold">{readinessScore}%</span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(readinessScore, 100)}%` }}
              />
            </div>
          </div>

          {career?.readiness?.nextActions?.length ? (
            <div className="mt-6">
              <h3 className="font-medium">Next actions</h3>

              <ul className="mt-3 space-y-2">
                {career.readiness.nextActions.slice(0, 3).map((action) => (
                  <li
                    key={action}
                    className="flex gap-2 text-sm text-muted-foreground"
                  >
                    <span>•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* Skill Gaps */}
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Priority Skill Gaps</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Skills that can improve your job readiness.
              </p>
            </div>

            <Link
              to="/career"
              className="text-sm font-medium hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {skillGaps.slice(0, 5).map((gap) => (
              <div
                key={gap.skill}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{gap.skill}</p>
                  <p className="text-xs text-muted-foreground">
                    Demand: {gap.demand}
                  </p>
                </div>

                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {gap.priority}
                </span>
              </div>
            ))}

            {!skillGaps.length && (
              <p className="text-sm text-muted-foreground">
                No skill gaps found.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Top Jobs */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Top Job Matches</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Jobs ranked according to your resume and career profile.
            </p>
          </div>

          <Link
            to="/recommendations"
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.slice(0, 3).map((job) => (
            <div
              key={job.jobId}
              className="rounded-lg border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">
                    {job.title}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {job.company}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                  {job.matchScore}%
                </span>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                {job.location} · {job.workMode}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {job.matchedSkills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-muted px-2 py-1 text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {!recommendations.length && (
            <p className="text-sm text-muted-foreground">
              No recommendations available.
            </p>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold">Quick Actions</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/recommendations"
            className="rounded-xl border bg-card p-5 transition hover:bg-muted/50"
          >
            <BriefcaseBusiness className="h-6 w-6" />
            <h3 className="mt-4 font-semibold">Job Recommendations</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore jobs matching your profile.
            </p>
          </Link>

          <Link
            to="/career"
            className="rounded-xl border bg-card p-5 transition hover:bg-muted/50"
          >
            <TrendingUp className="h-6 w-6" />
            <h3 className="mt-4 font-semibold">Career Intelligence</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Understand your strengths and skill gaps.
            </p>
          </Link>

          <Link
            to="/roadmap"
            className="rounded-xl border bg-card p-5 transition hover:bg-muted/50"
          >
            <Map className="h-6 w-6" />
            <h3 className="mt-4 font-semibold">Career Roadmap</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow your personalized career roadmap.
            </p>
          </Link>

          <Link
            to="/assistant"
            className="rounded-xl border bg-card p-5 transition hover:bg-muted/50"
          >
            <Bot className="h-6 w-6" />
            <h3 className="mt-4 font-semibold">AI Career Assistant</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask questions about your career.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}