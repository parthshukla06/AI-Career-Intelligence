export interface Recommendation {
  jobId: string;
  title: string;
  company: string;
  location: string;
  workMode: string;

  matchScore: number;
  skillMatchScore: number;
  semanticSimilarityScore: number;
  experienceMatchScore: number;
  roleMatchScore: number;

  matchedSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];

  experienceMatch: number;
  roleMatch: number;
}

export interface RecommendationsResponse {
  success: boolean;
  data: {
    resumeId: string;
    recommendations: Recommendation[];
  };
}
