import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { User, Mail, FileText, ArrowRight } from "lucide-react";

import { getMe } from "@/api/auth";

export function ProfilePage() {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["current-user"],
    queryFn: getMe,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile & Preferences</h1>
          <p className="mt-2 text-muted-foreground">
            Loading your account information...
          </p>
        </div>

        <div className="h-48 animate-pulse rounded-xl border bg-muted/40" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold">
          Unable to load profile
        </h2>
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
          Profile & Preferences
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account information and career profile.
        </p>
      </div>

      {/* Profile Card */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-10 w-10 text-primary" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{user.name}</h2>
            <p className="mt-1 text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="mt-1 font-medium">{user.name}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="mt-1 font-medium">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Career Profile */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold">Career Profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your resume powers personalized job recommendations,
              career intelligence, and AI guidance.
            </p>

            <Link
              to="/resume"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              View Resume Analysis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Account Information */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Account Information</h2>

        <div className="mt-5 rounded-lg bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">User ID</p>
          <p className="mt-1 break-all font-mono text-sm">{user.id}</p>
        </div>
      </section>
    </div>
  );
}