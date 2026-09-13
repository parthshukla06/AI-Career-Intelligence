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
