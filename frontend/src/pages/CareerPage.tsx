import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import { getCareerOverview } from "@/api/career";
import { useAuthStore } from "@/store/authStore";

export function CareerPage() {
  const resumeId = useAuthStore((state) => state.resumeId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["career", resumeId],
    queryFn: () => getCareerOverview(resumeId!),
    enabled: Boolean(resumeId),
  });

  if (!resumeId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Briefcase className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">Upload Your Resume First</h1>
          <p className="mt-2 text-muted-foreground">
            Upload and analyze your resume to generate your personalized career
            intelligence.
          </p>
          <Link
            to="/resume"
            className="mt-6 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Go to Resume
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
          <div className="h-48 animate-pulse rounded-xl bg-muted lg:col-span-2" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
        <h2 className="text-lg font-semibold">Unable to load career insights</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please try again after confirming your resume has been analyzed.
        </p>
      </div>
    );
  }

  const {
    readiness,
    skillGaps,
    recommendations,
    experienceRecommendations,
  } = data.data;

  const topRecommendations = recommendations.slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Career Intelligence
          </h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Understand your career readiness, skill gaps, and best-fit roles.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Career Readiness</h2>
          </div>

          <div className="mt-6 flex items-center gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-primary/20">
              <span className="text-2xl font-bold">{readiness.score}</span>
            </div>

            <div>
              <p className="text-xl font-semibold">{readiness.level}</p>
              <p className="text-sm text-muted-foreground">
                Overall career readiness
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 lg:col-span-2">
          <h2 className="font-semibold">Your Strengths</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {readiness.strengths.map((strength) => (
              <div
                key={strength}
                className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>{strength}</span>
              </div>
            ))}
          </div>

          <h2 className="mt-6 font-semibold">Focus Areas</h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {readiness.gaps.map((gap) => (
              <span
                key={gap}
                className="rounded-full bg-muted px-3 py-1.5 text-sm"
              >
                {gap}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Recommended Next Actions</h2>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {readiness.nextActions.map((action, index) => (
            <div key={action} className="rounded-lg border p-4">
              <span className="text-sm font-semibold text-primary">
                0{index + 1}
              </span>
              <p className="mt-2 text-sm">{action}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Skill Gaps</h2>
            <p className="text-sm text-muted-foreground">
              Skills that can improve your competitiveness.
            </p>
          </div>
        </div>

        {skillGaps.length === 0 ? (
          <div className="mt-4 rounded-xl border p-6 text-center text-muted-foreground">
            No significant skill gaps found.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {skillGaps.slice(0, 9).map((gap) => (
              <div key={gap.skill} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{gap.skill}</h3>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {gap.priority}
                  </span>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {gap.reason}
                </p>

                <div className="mt-4 text-xs text-muted-foreground">
                  Demand: <span className="font-medium">{gap.demand}</span>
                  {" · "}
                  Missing in{" "}
                  <span className="font-medium">{gap.missingInJobs}</span> jobs
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Career Fit</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Roles grouped according to your current profile.
        </p>

        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <RoleGroup
            title="Strong Fit"
            roles={experienceRecommendations.strongFit}
          />
          <RoleGroup
            title="Possible Fit"
            roles={experienceRecommendations.possibleFit}
          />
          <RoleGroup
            title="Stretch Roles"
            roles={experienceRecommendations.stretchRole}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Top Career Matches</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Detailed analysis of roles that match your resume.
        </p>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {topRecommendations.map((job, index) => (
            <div key={job.jobId} className="rounded-xl border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    MATCH #{index + 1}
                  </span>
                  <h3 className="mt-1 text-lg font-semibold">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {job.company} · {job.location}
                  </p>
                </div>

                <div className="rounded-lg bg-primary/10 px-3 py-2 text-center">
                  <div className="text-xl font-bold text-primary">
                    {job.overallScore}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    MATCH
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Score label="Skills" value={job.skillMatchScore} />
                <Score label="Semantic" value={job.semanticScore} />
                <Score label="Experience" value={job.experienceMatchScore} />
                <Score label="Role" value={job.roleMatchScore} />
              </div>

              {job.missingRequiredSkills.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium">Missing skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.missingRequiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.explanation?.recommendedNextSteps?.length ? (
                <div className="mt-5 rounded-lg bg-muted/50 p-4">
                  <p className="text-sm font-medium">Next steps</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {job.explanation.recommendedNextSteps
                      .slice(0, 3)
                      .map((step) => (
                        <li key={step}>• {step}</li>
                      ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function RoleGroup({
  title,
  roles,
}: {
  title: string;
  roles: {
    title: string;
    company: string;
    overallScore?: number;
    matchScore?: number;
  }[];
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold">{title}</h3>

      <div className="mt-4 space-y-3">
        {roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No roles in this category.
          </p>
        ) : (
          roles.slice(0, 5).map((role) => (
            <div
              key={`${role.title}-${role.company}`}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{role.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {role.company}
                </p>
              </div>

              <span className="shrink-0 text-sm font-semibold">
                {role.matchScore ?? role.overallScore ?? 0}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
