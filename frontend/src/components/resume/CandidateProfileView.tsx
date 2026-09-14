import {
  Award,
  BookOpen,
  Briefcase,
  Clock,
  Code2,
  FolderOpen,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Target,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CandidateProfile } from "@/types/resume";

interface SectionHeadingProps {
  icon: React.ReactNode;
  title: string;
}

function SectionHeading({ icon, title }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground text-sm tracking-wide uppercase">
        {title}
      </h3>
    </div>
  );
}

interface SkillChipProps {
  label: string;
  variant?: "primary" | "secondary";
}

function SkillChip({ label, variant = "secondary" }: SkillChipProps) {
  return (
    <Badge
      variant={variant === "primary" ? "default" : "secondary"}
      className="text-xs font-medium"
    >
      {label}
    </Badge>
  );
}

interface CandidateProfileViewProps {
  profile: CandidateProfile;
  filename?: string;
  className?: string;
}

export function CandidateProfileView({
  profile,
  filename,
  className,
}: CandidateProfileViewProps) {
  const hasExperience = profile.experience.length > 0;
  const hasEducation = profile.education.length > 0;
  const hasProjects = profile.projects.length > 0;
  const hasSkills = profile.skills.length > 0;
  const hasCertifications = profile.certifications.length > 0;
  const hasTargetRoles = profile.targetRoles.length > 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* ── Header card ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-background p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xl">
            {profile.name
              ? profile.name.charAt(0).toUpperCase()
              : <User className="h-6 w-6" />}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground leading-tight">
              {profile.name ?? "Name not detected"}
            </h2>

            {/* Contact row */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {profile.email && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {profile.email}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {profile.phone}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {profile.location}
                </span>
              )}
              {profile.totalExperience > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {profile.totalExperience} yr
                  {profile.totalExperience !== 1 ? "s" : ""} experience
                </span>
              )}
            </div>

            {/* Summary */}
            {profile.summary && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-4">
                {profile.summary}
              </p>
            )}
          </div>
        </div>

        {/* Filename badge */}
        {filename && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{filename}</span>
          </div>
        )}
      </div>

      {/* ── Skills ────────────────────────────────────────────────── */}
      {hasSkills && (
        <div className="rounded-lg border border-border bg-card p-5">
          <SectionHeading
            icon={<Code2 className="h-4 w-4" />}
            title="Skills"
          />
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <SkillChip key={skill} label={skill} variant="primary" />
            ))}
          </div>
        </div>
      )}

      {/* ── Target roles ──────────────────────────────────────────── */}
      {hasTargetRoles && (
        <div className="rounded-lg border border-border bg-card p-5">
          <SectionHeading
            icon={<Target className="h-4 w-4" />}
            title="Target Roles"
          />
          <div className="flex flex-wrap gap-2">
            {profile.targetRoles.map((role) => (
              <SkillChip key={role} label={role} />
            ))}
          </div>
        </div>
      )}

      {/* ── Experience ────────────────────────────────────────────── */}
      {hasExperience && (
        <div className="rounded-lg border border-border bg-card p-5">
          <SectionHeading
            icon={<Briefcase className="h-4 w-4" />}
            title="Experience"
          />
          <div className="space-y-5">
            {profile.experience.map((exp, i) => (
              <div key={i}>
                {i > 0 && <Separator className="mb-5" />}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {exp.role ?? "Role not specified"}
                    </p>
                    {exp.company && (
                      <p className="text-sm text-muted-foreground">
                        {exp.company}
                      </p>
                    )}
                  </div>
                  {exp.duration && (
                    <span className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full self-start">
                      {exp.duration}
                    </span>
                  )}
                </div>
                {exp.description && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {exp.description}
                  </p>
                )}
                {exp.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {exp.skills.map((skill) => (
                      <SkillChip key={skill} label={skill} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Education ─────────────────────────────────────────────── */}
      {hasEducation && (
        <div className="rounded-lg border border-border bg-card p-5">
          <SectionHeading
            icon={<GraduationCap className="h-4 w-4" />}
            title="Education"
          />
          <div className="space-y-4">
            {profile.education.map((edu, i) => (
              <div key={i}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {[edu.degree, edu.field].filter(Boolean).join(" — ") ||
                        "Degree not specified"}
                    </p>
                    {edu.institution && (
                      <p className="text-sm text-muted-foreground">
                        {edu.institution}
                      </p>
                    )}
                  </div>
                  {edu.year && (
                    <span className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full self-start">
                      {edu.year}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Projects ──────────────────────────────────────────────── */}
      {hasProjects && (
        <div className="rounded-lg border border-border bg-card p-5">
          <SectionHeading
            icon={<FolderOpen className="h-4 w-4" />}
            title="Projects"
          />
          <div className="space-y-5">
            {profile.projects.map((project, i) => (
              <div key={i}>
                {i > 0 && <Separator className="mb-5" />}
                <p className="font-semibold text-sm text-foreground">
                  {project.name ?? `Project ${i + 1}`}
                </p>
                {project.description && (
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                )}
                {project.technologies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {project.technologies.map((tech) => (
                      <SkillChip key={tech} label={tech} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Certifications ────────────────────────────────────────── */}
      {hasCertifications && (
        <div className="rounded-lg border border-border bg-card p-5">
          <SectionHeading
            icon={<Award className="h-4 w-4" />}
            title="Certifications"
          />
          <ul className="space-y-1.5">
            {profile.certifications.map((cert) => (
              <li key={cert} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {cert}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
