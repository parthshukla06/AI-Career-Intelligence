import { Building2, MapPin, Briefcase, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IJob } from "@/types/jobs";

// ── Label helpers ─────────────────────────────────────────────────────────────

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

function workModeBadgeVariant(
  mode: string,
): "default" | "secondary" | "outline" {
  if (mode === "remote") return "default";
  if (mode === "hybrid") return "secondary";
  return "outline";
}

function formatSalary(min?: number, max?: number, currency = "INR"): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 100_000
      ? `${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)}L`
      : n >= 1_000
        ? `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
        : String(n);
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  return `Up to ${currency} ${fmt(max!)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface JobCardProps {
  job: IJob;
  className?: string;
}

export function JobCard({ job, className }: JobCardProps) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);
  const expRange =
    job.minExperience === job.maxExperience
      ? `${job.minExperience} yr`
      : `${job.minExperience}–${job.maxExperience} yr`;

  return (
    <Link
      to={`/jobs/${job._id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm",
        "transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-base leading-tight group-hover:text-primary transition-colors">
            {job.title}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>
        </div>
        <Badge variant={workModeBadgeVariant(job.workMode)} className="shrink-0 text-xs">
          {WORK_MODE_LABELS[job.workMode] ?? job.workMode}
        </Badge>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          {job.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 shrink-0" />
          {expRange} exp · {EXPERIENCE_LEVEL_LABELS[job.experienceLevel] ?? job.experienceLevel}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="h-3 w-3 shrink-0" />
          {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
        </span>
        {salary && (
          <span className="font-medium text-foreground">{salary}</span>
        )}
      </div>

      {/* Industry chip */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {job.industry}
        </span>
      </div>

      {/* Required skills (first 5) */}
      {job.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.requiredSkills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground"
            >
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 5 && (
            <span className="rounded border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground">
              +{job.requiredSkills.length - 5} more
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
