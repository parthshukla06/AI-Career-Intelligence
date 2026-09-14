import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 shadow-sm space-y-3",
        className,
      )}
    >
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 2 ? "w-1/3" : "w-full")}
        />
      ))}
    </div>
  );
}
