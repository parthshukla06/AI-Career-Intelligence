/**
 * Types mirroring the backend Resume model and CandidateProfile type exactly.
 *
 * Sources:
 *   backend/src/types/candidateProfile.ts
 *   backend/src/models/Resume.ts
 */

// ── Candidate profile sub-types ───────────────────────────────────────────────

export interface CandidateExperience {
  company: string | null;
  role: string | null;
  duration: string | null;
  description: string;
  skills: string[];
}

export interface CandidateEducation {
  institution: string | null;
  degree: string | null;
  field: string | null;
  year: string | null;
}

export interface CandidateProject {
  name: string | null;
  description: string;
  technologies: string[];
}

export interface CandidateProfile {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  experience: CandidateExperience[];
  education: CandidateEducation[];
  projects: CandidateProject[];
  certifications: string[];
  totalExperience: number;
  targetRoles: string[];
}

// ── Upload response (POST /api/resumes/upload → 201) ─────────────────────────
// data field returned by the controller:
//   { id, originalFilename, candidateProfile }

export interface ResumeUploadData {
  id: string;
  originalFilename: string;
  candidateProfile: CandidateProfile;
}

// ── Full resume document (GET /api/resumes/:id → 200) ────────────────────────
// extractedText and candidateEmbedding are excluded by the backend query

export type ResumeProcessingStatus = "completed" | "failed";
export type AIAnalysisStatus = "pending" | "completed" | "failed";

export interface IResume {
  _id: string;
  originalFilename: string;
  candidateProfile?: CandidateProfile;
  uploadedAt: string;
  processingStatus: ResumeProcessingStatus;
  processingError?: string;
  aiAnalysisStatus: AIAnalysisStatus;
  aiModel?: string;
  createdAt: string;
  updatedAt: string;
}
