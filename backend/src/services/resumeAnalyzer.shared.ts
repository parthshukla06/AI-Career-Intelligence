import { z } from "zod";

const nullableString = z.string().trim().max(5000).nullable();

export const candidateProfileSchema = z.object({
  name: nullableString,
  email: nullableString,
  phone: nullableString,
  location: nullableString,
  summary: nullableString,
  skills: z.array(z.string().trim().min(1).max(100)).max(100),
  experience: z.array(z.object({
    company: nullableString,
    role: nullableString,
    duration: nullableString,
    description: z.string().trim().max(5000),
    skills: z.array(z.string().trim().min(1).max(100)).max(100),
  }).strict()).max(30),
  education: z.array(z.object({
    institution: nullableString,
    degree: nullableString,
    field: nullableString,
    year: nullableString,
  }).strict()).max(20),
  projects: z.array(z.object({
    name: nullableString,
    description: z.string().trim().max(5000),
    technologies: z.array(z.string().trim().min(1).max(100)).max(100),
  }).strict()).max(30),
  certifications: z.array(z.string().trim().min(1).max(300)).max(50),
  totalExperience: z.number().min(0).max(80),
  targetRoles: z.array(z.string().trim().min(1).max(200)).max(20),
}).strict();

export const candidateProfileJsonSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["name", "email", "phone", "location", "summary", "skills", "experience", "education", "projects", "certifications", "totalExperience", "targetRoles"],
  properties: {
    name: { type: ["string", "null"] }, email: { type: ["string", "null"] }, phone: { type: ["string", "null"] },
    location: { type: ["string", "null"] }, summary: { type: ["string", "null"] },
    skills: { type: "array", items: { type: "string" } }, certifications: { type: "array", items: { type: "string" } },
    totalExperience: { type: "number" }, targetRoles: { type: "array", items: { type: "string" } },
    experience: { type: "array", items: { type: "object", additionalProperties: false, required: ["company", "role", "duration", "description", "skills"], properties: { company: { type: ["string", "null"] }, role: { type: ["string", "null"] }, duration: { type: ["string", "null"] }, description: { type: "string" }, skills: { type: "array", items: { type: "string" } } } } },
    education: { type: "array", items: { type: "object", additionalProperties: false, required: ["institution", "degree", "field", "year"], properties: { institution: { type: ["string", "null"] }, degree: { type: ["string", "null"] }, field: { type: ["string", "null"] }, year: { type: ["string", "null"] } } } },
    projects: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "description", "technologies"], properties: { name: { type: ["string", "null"] }, description: { type: "string" }, technologies: { type: "array", items: { type: "string" } } } } },
  },
};

export const resumeExtractionInstructions = `You extract a candidate profile from resume text. Return only data that is explicitly supported by the supplied text. Never invent or infer skills, companies, job titles, education, certifications, projects, experience, or target roles. Use null for missing scalar fields and [] for missing lists. Do not treat learning, coursework, or a personal project as professional experience. Keep separate projects and separate work or internship experiences as distinct objects. Do not include skill headings or categories as skills; extract clean individual skills and remove duplicates. Do not add skills merely because they suit a role. You may clean obvious formatting noise, but preserve factual meaning. totalExperience is a numeric estimate only when the resume explicitly supports it; otherwise use 0.`;