import { IJob } from "../models/Job";
import { CandidateProfile } from "../types/candidateProfile";

export const candidateEmbeddingText = (candidate: CandidateProfile): string => [
  `Summary: ${candidate.summary || ""}`,
  `Skills: ${candidate.skills.join(", ")}`,
  `Experience: ${candidate.experience.map((entry) => [entry.role, entry.description, entry.skills.join(", ")].filter(Boolean).join(" | ")).join("\n")}`,
  `Projects: ${candidate.projects.map((project) => [project.name, project.description, project.technologies.join(", ")].filter(Boolean).join(" | ")).join("\n")}`,
  `Education: ${candidate.education.map((entry) => [entry.degree, entry.field].filter(Boolean).join(" ")).join(", ")}`,
  `Target roles: ${candidate.targetRoles.join(", ")}`,
].join("\n").trim();

export const jobEmbeddingText = (job: Pick<IJob, "title" | "industry" | "requiredSkills" | "preferredSkills" | "responsibilities" | "qualifications" | "jobDescription" | "experienceLevel">): string => [
  `Title: ${job.title}`,
  `Industry: ${job.industry}`,
  `Experience level: ${job.experienceLevel}`,
  `Required skills: ${(job.requiredSkills || []).join(", ")}`,
  `Preferred skills: ${(job.preferredSkills || []).join(", ")}`,
  `Responsibilities: ${(job.responsibilities || []).join("; ")}`,
  `Qualifications: ${(job.qualifications || []).join("; ")}`,
  `Job description: ${job.jobDescription}`,
].join("\n").trim();