/**
 * Types mirroring the backend Job model exactly.
 * Sources:
 *   backend/src/models/Job.ts
 *   backend/src/models/JobApplication.ts
 *   backend/src/models/JobFeedback.ts
 *   backend/src/models/SavedJob.ts
 *   backend/src/services/jobMatching.service.ts
 */

// ── Enum constants (mirrors backend) ─────────────────────────────────────────

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
export const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship"] as const;
export const EXPERIENCE_LEVELS = ["intern", "entry", "mid", "senior", "lead", "manager"] as const;
export const APPLICATION_STATUSES = ["interested", "applied", "interview", "rejected", "offer"] as const;
export const JOB_FEEDBACK_VALUES = ["interested", "not_interested"] as const;

export type WorkMode = (typeof WORK_MODES)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type JobFeedbackValue = (typeof JOB_FEEDBACK_VALUES)[number];

// ── Job document (GET /api/jobs and GET /api/jobs/:id) ────────────────────────

export interface IJob {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
}

// ── Query filters (maps to GET /api/jobs query params) ────────────────────────

export interface JobFilters {
  title?: string;
  industry?: string;
  experienceLevel?: ExperienceLevel | "";
  workMode?: WorkMode | "";
  location?: string;
  skills?: string;
}

// ── List response ─────────────────────────────────────────────────────────────

export interface JobsListResponse {
  success: boolean;
  count: number;
  data: IJob[];
}

// ── Single job response ───────────────────────────────────────────────────────

export interface JobDetailResponse {
  success: boolean;
  data: IJob;
}
