import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Lightbulb,
  Target,
} from "lucide-react";

import { getCareerPaths } from "@/api/careerPaths";
import { useAuthStore } from "@/store/authStore";

export function CareerPathsPage() {
  const resumeId = useAuthStore((state) => state.resumeId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["career-paths", resumeId],
    queryFn: () => getCareerPaths(resumeId!),
    enabled: Boolean(resumeId),
  });

  if (!resumeId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Compass className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">
            Analyze Your Resume First
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Career paths are generated from your analyzed candidate profile.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold">
          Unable to load career paths
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please make sure your resume has been analyzed and try again.
        </p>
      </div>
    );
  }

  const paths = data.data.paths;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Career Paths
          </h1>
        </div>

        <p className="mt-2 text-muted-foreground">
          Explore career directions supported by your skills, profile, and job
          recommendations.
        </p>
      </div>

      {paths.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            No strong career paths identified
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add more relevant skills or refine your target roles to generate
            stronger career-path matches.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {paths.map((path) => (
            <div
              key={path.title}
              className="rounded-xl border bg-card p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Compass className="h-5 w-5 text-primary" />
                  </div>

                  <h2 className="mt-4 text-xl font-semibold">
                    {path.title}
                  </h2>
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Why it fits
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {path.whyItFits}
                </p>
              </div>

              <PathSection
                title="Your Strengths"
                items={path.strengths}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />

              <PathSection
                title="Main Gaps"
                items={path.mainGaps}
                icon={<Target className="h-4 w-4" />}
              />

              <PathSection
                title="Recommended Next Skills"
                items={path.recommendedNextSkills}
                icon={<ArrowRight className="h-4 w-4" />}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PathSection({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  if (!items.length) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full bg-muted px-3 py-1.5 text-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
