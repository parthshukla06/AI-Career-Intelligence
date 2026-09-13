import mongoose, { Schema, type Model } from "mongoose";

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
export const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship"] as const;
export const EXPERIENCE_LEVELS = ["intern", "entry", "mid", "senior", "lead", "manager"] as const;

export type WorkMode = (typeof WORK_MODES)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export interface IJob {
  title: string;
  company: string;
  industry: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  minExperience: number;
  maxExperience: number;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  education: string;
  jobDescription: string;
  source: string;
  sourceUrl: string;
  isActive: boolean;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    workMode: { type: String, enum: WORK_MODES, required: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, required: true },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, required: true },
    minExperience: { type: Number, required: true, min: 0 },
    maxExperience: { type: Number, required: true, min: 0 },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    currency: { type: String, required: true, default: "INR", trim: true, uppercase: true },
    requiredSkills: { type: [String], required: true, default: [] },
    preferredSkills: { type: [String], default: [] },
    responsibilities: { type: [String], required: true, default: [] },
    qualifications: { type: [String], required: true, default: [] },
    education: { type: String, required: true, trim: true },
    jobDescription: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    sourceUrl: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
    embedding: { type: [Number], default: undefined, select: false },
  },
  { timestamps: true },
);

jobSchema.index({ title: 1, company: 1 });
jobSchema.index({ industry: 1, experienceLevel: 1 });
jobSchema.index({ location: 1, workMode: 1 });

const existingJobModel = mongoose.models.Job as Model<IJob> | undefined;

export const Job: Model<IJob> = existingJobModel || mongoose.model<IJob>("Job", jobSchema);
