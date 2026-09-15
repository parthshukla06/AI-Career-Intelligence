import { Link } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  Briefcase,
  FileSearch,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const features = [
  {
    icon: FileSearch,
    title: "AI Resume Analysis",
    description:
      "Upload your resume and get instant AI-powered skill extraction and candidate profile generation.",
  },
  {
    icon: Briefcase,
    title: "Intelligent Job Matching",
    description:
      "Deterministic scoring across skills, experience, role alignment, and semantic similarity.",
  },
  {
    icon: BrainCircuit,
    title: "Career Intelligence",
    description:
      "Skill gap analysis, readiness score, what-if simulations, and experience recommendations.",
  },
  {
    icon: TrendingUp,
    title: "AI Career Assistant",
    description:
      "Chat with an AI assistant, get a personalised roadmap, and receive resume improvement suggestions.",
  },
];

export function LandingPage() {
  const { token, resumeId } = useAuthStore();

  const resumeTarget = token
    ? resumeId
      ? "/career"
      : "/resume"
    : "/login";

  const jobsTarget = token ? "/jobs" : "/login";

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-16 sm:py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            <BrainCircuit className="h-3.5 w-3.5" />
            AI-Powered Career Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            Accelerate your career with{" "}
            <span className="text-primary">intelligent guidance</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Upload your resume, discover matching jobs, understand your skill
            gaps, and get an AI-powered roadmap to your next role.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to={resumeTarget}>
                {token && resumeId
                  ? "View Career Intelligence"
                  : "Upload your resume"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button size="lg" variant="outline" asChild>
              <Link to={jobsTarget}>Browse jobs</Link>
            </Button>

            {!token && (
              <Button size="lg" variant="ghost" asChild>
                <Link to="/register">Create free account</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-12 border-t border-border">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-foreground mb-10">
            Everything you need to land your next role
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-lg border border-border bg-card p-6 space-y-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <h3 className="font-semibold text-foreground">{title}</h3>

                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      {!token && (
        <section className="py-12 border-t border-border text-center">
          <h2 className="text-xl font-bold text-foreground mb-3">
            Ready to get started?
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            Create a free account to unlock personalized recommendations,
            application tracking, and your learning progress dashboard.
          </p>

          <Button asChild>
            <Link to="/register">
              Get started for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}