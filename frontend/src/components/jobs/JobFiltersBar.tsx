import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORK_MODES, EXPERIENCE_LEVELS } from "@/types/jobs";
import type { JobFilters, WorkMode, ExperienceLevel } from "@/types/jobs";

interface JobFiltersBarProps {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
  className?: string;
}

const WORK_MODE_LABELS_LOCAL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

const EXPERIENCE_LEVEL_LABELS_LOCAL: Record<string, string> = {
  intern: "Intern",
  entry: "Entry",
  mid: "Mid",
  senior: "Senior",
  lead: "Lead",
  manager: "Manager",
};

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background " +
  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-50 text-foreground";

export function JobFiltersBar({ filters, onChange, className }: JobFiltersBarProps) {
  const hasActiveFilters =
    !!filters.title ||
    !!filters.industry ||
    !!filters.experienceLevel ||
    !!filters.workMode ||
    !!filters.location ||
    !!filters.skills;

  function set<K extends keyof JobFilters>(key: K, value: JobFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function clearAll() {
    onChange({
      title: "",
      industry: "",
      experienceLevel: "",
      workMode: "",
      location: "",
      skills: "",
    });
  }

  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      {/* Title search */}
      <div className="relative min-w-[160px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Job title…"
          value={filters.title ?? ""}
          onChange={(e) => set("title", e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Location */}
      <div className="min-w-[140px] flex-1">
        <Input
          placeholder="Location…"
          value={filters.location ?? ""}
          onChange={(e) => set("location", e.target.value)}
          className="h-9"
        />
      </div>

      {/* Work mode */}
      <select
        value={filters.workMode ?? ""}
        onChange={(e) => set("workMode", e.target.value as WorkMode | "")}
        className={cn(selectClass, "min-w-[110px]")}
        aria-label="Work mode"
      >
        <option value="">All modes</option>
        {WORK_MODES.map((m) => (
          <option key={m} value={m}>
            {WORK_MODE_LABELS_LOCAL[m]}
          </option>
        ))}
      </select>

      {/* Experience level */}
      <select
        value={filters.experienceLevel ?? ""}
        onChange={(e) =>
          set("experienceLevel", e.target.value as ExperienceLevel | "")
        }
        className={cn(selectClass, "min-w-[120px]")}
        aria-label="Experience level"
      >
        <option value="">All levels</option>
        {EXPERIENCE_LEVELS.map((l) => (
          <option key={l} value={l}>
            {EXPERIENCE_LEVEL_LABELS_LOCAL[l]}
          </option>
        ))}
      </select>

      {/* Skills */}
      <div className="min-w-[150px] flex-1">
        <Input
          placeholder="Skills (comma-sep)…"
          value={filters.skills ?? ""}
          onChange={(e) => set("skills", e.target.value)}
          className="h-9"
          title="Comma-separated skill terms, e.g. React, Node.js"
        />
      </div>

      {/* Clear button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-9 px-3 text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
