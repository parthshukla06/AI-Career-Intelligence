export interface CareerRecommendation {
  jobId: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  overallScore: number;
  skillMatchScore: number;
  semanticScore: number;
  experienceMatchScore: number;
  roleMatchScore: number;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  experienceAssessment?: string;
  roleAssessment?: string;
  explanation?: {
    whyGoodMatch: string[];
    keySkillGaps: string[];
    experienceGap: string;
    recommendedNextSteps: string[];
  };
}

export interface SkillGap {
  skill: string;
  priority: string;
  demand: number;
  matchedJobs: number;
  missingInJobs: number;
  reason: string;
}

export interface Readiness {
  score: number;
  level: string;
  strengths: string[];
  gaps: string[];
  nextActions: string[];
}

export interface ExperienceRecommendations {
  strongFit: CareerRecommendation[];
  possibleFit: CareerRecommendation[];
  stretchRole: CareerRecommendation[];
}

export interface CareerOverviewResponse {
  success: boolean;
  data: {
    resumeId: string;
    recommendations: CareerRecommendation[];
    skillGaps: SkillGap[];
    readiness: Readiness;
    experienceRecommendations: ExperienceRecommendations;
  };
}
