import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";

import { getJobs } from "@/api/jobs";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFiltersBar } from "@/components/jobs/JobFiltersBar";
import type { JobFilters } from "@/types/jobs";

const EMPTY_FILTERS: JobFilters = {
  title: "",
  industry: "",
  experienceLevel: "",
  workMode: "",
  location: "",
  skills: "",
};

// Debounce delay in ms for text fields — avoids hammering the API on every keystroke
const DEBOUNCE_MS = 400;

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>(EMPTY_FILTERS);
  const debouncedFilters = useDebounced(filters, DEBOUNCE_MS);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["jobs", debouncedFilters],
    queryFn: () => getJobs(debouncedFilters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const jobs = data?.data ?? [];
  const count = data?.count ?? 0;

  const handleFiltersChange = useCallback((next: JobFilters) => {
    setFilters(next);
  }, []);

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle="Browse and filter available job listings."
      />

      {/* Filter bar */}
      <div className="mb-6">
        <JobFiltersBar filters={filters} onChange={handleFiltersChange} />
      </div>

      {/* Result count */}
      {!isLoading && !isError && (
        <p className="mb-4 text-sm text-muted-foreground">
          {count === 0
            ? "No jobs found."
            : count === 1
              ? "1 job found"
              : `${count} jobs found`}
        </p>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={5} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <ErrorState
          message="Could not load job listings. Please check your connection and try again."
          onRetry={() => refetch()}
        />
      )}

      {/* Empty state */}
      {!isLoading && !isError && jobs.length === 0 && (
        <EmptyState
          icon={<Briefcase className="h-8 w-8" />}
          title="No jobs match your filters"
          description="Try adjusting or clearing the filters to see more results."
        />
      )}

      {/* Job grid */}
      {!isLoading && !isError && jobs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
