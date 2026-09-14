import { useMutation } from "@tanstack/react-query";
import { FileText, Loader2, Sparkles } from "lucide-react";

import { getResumeImprovement } from "@/api/resumeImprovement";
import { useAuthStore } from "@/store/authStore";

export function ResumeImprovementPage() {
  const resumeId = useAuthStore((state) => state.resumeId);

  const improvementMutation = useMutation({
    mutationFn: () => getResumeImprovement(resumeId!),
  });

  if (!resumeId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">
            Analyze Your Resume First
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Resume improvement suggestions are generated from your analyzed
            candidate profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Resume Improvement
          </h1>
        </div>

        <p className="mt-2 text-muted-foreground">
          Get AI-powered suggestions to make your resume clearer, stronger,
          and more aligned with your target roles.
        </p>
      </div>

      {!improvementMutation.data && (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Analyze your resume
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The assistant will review your existing profile without
                inventing achievements or experience.
              </p>
            </div>

            <button
              type="button"
              onClick={() => improvementMutation.mutate()}
              disabled={improvementMutation.isPending}
              className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {improvementMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Improve My Resume
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {improvementMutation.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="font-semibold text-destructive">
            Unable to generate suggestions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Please try again in a moment.
          </p>

          <button
            type="button"
            onClick={() => improvementMutation.mutate()}
            className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Try Again
          </button>
        </div>
      )}

      {improvementMutation.data?.data?.answer && (
        <section className="rounded-xl border bg-card p-5 md:p-7">
          <div className="mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">
              AI Resume Analysis
            </h2>
          </div>

          <ResumeMarkdown
            content={improvementMutation.data.data.answer}
          />
        </section>
      )}

      {improvementMutation.data?.data?.sources?.length ? (
        <section className="rounded-xl border bg-muted/40 p-5">
          <h2 className="font-semibold">Supporting Sources</h2>

          <div className="mt-3 space-y-2">
            {improvementMutation.data.data.sources.map((source, index) => (
              <div
                key={`${source.title}-${index}`}
                className="rounded-lg border bg-card p-3"
              >
                <p className="text-sm font-medium">{source.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {source.category}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ResumeMarkdown({ content }: { content: string }) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5 leading-7">
      {blocks.map((block, index) => {
        const lines = block.split("\n");

        if (lines.every((line) => /^[-*•]\s+/.test(line.trim()))) {
          return (
            <ul key={index} className="ml-6 list-disc space-y-2">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {formatInline(line.trim().replace(/^[-*•]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every((line) => /^\d+[.)]\s+/.test(line.trim()))) {
          return (
            <ol key={index} className="ml-6 list-decimal space-y-2">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {formatInline(
                    line.trim().replace(/^\d+[.)]\s+/, "")
                  )}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <div key={index}>
            {lines.map((line, lineIndex) => {
              const heading = line.match(/^#{1,6}\s+(.*)$/);

              if (heading) {
                return (
                  <h3
                    key={lineIndex}
                    className="mb-2 text-lg font-bold"
                  >
                    {formatInline(heading[1])}
                  </h3>
                );
              }

              return (
                <p key={lineIndex} className="mb-2 last:mb-0">
                  {formatInline(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
}
