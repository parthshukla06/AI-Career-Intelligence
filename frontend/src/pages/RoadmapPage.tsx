import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Briefcase,
  CheckCircle2,
  Code2,
  MessageSquare,
  Target,
  TrendingUp,
} from "lucide-react";

import { getCareerRoadmap } from "@/api/roadmap";
import { useAuthStore } from "@/store/authStore";

export function RoadmapPage() {
  const resumeId = useAuthStore((state) => state.resumeId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["career-roadmap", resumeId],
    queryFn: () => getCareerRoadmap(resumeId!),
    enabled: Boolean(resumeId),
  });

  if (!resumeId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Target className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">Analyze Your Resume First</h1>
          <p className="mt-2 text-muted-foreground">
            Your personalized roadmap is generated from your analyzed resume.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (isError || !data?.data?.roadmap) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold">Unable to generate roadmap</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please make sure your resume has been analyzed and try again.
        </p>
      </div>
    );
  }

  const { roadmap } = data.data;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Career Roadmap
          </h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          A personalized path from your current level toward your target role.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            Current Level
          </div>
          <p className="mt-2 text-2xl font-bold">{roadmap.currentLevel}</p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            Target Role
          </div>
          <p className="mt-2 text-2xl font-bold">{roadmap.targetRole}</p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Priority Skills</h2>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Focus on these skills first based on your current career gaps.
        </p>

        {roadmap.prioritySkills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {roadmap.prioritySkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No high-priority skill gaps were identified.
          </p>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Your 3-Phase Roadmap</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Follow each phase progressively instead of trying to learn
            everything at once.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {roadmap.stages.map((stage) => (
            <div
              key={stage.phase}
              className="relative rounded-xl border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {stage.phase}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Phase {stage.phase}
                  </p>
                  <h3 className="font-semibold">{stage.title}</h3>
                </div>
              </div>

              <RoadmapSection
                icon={<BookOpen className="h-4 w-4" />}
                title="Skills"
                items={stage.skills}
              />

              <RoadmapSection
                icon={<Code2 className="h-4 w-4" />}
                title="Projects"
                items={stage.projects}
              />

              <RoadmapSection
                icon={<MessageSquare className="h-4 w-4" />}
                title="Interview Preparation"
                items={stage.interviewPreparation}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-muted/40 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-semibold">How to use this roadmap</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete the skills and project work in each phase before moving
              to the next one. Keep your projects documented and use the
              interview preparation points alongside your learning.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function RoadmapSection({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
