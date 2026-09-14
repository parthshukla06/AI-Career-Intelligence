export interface CareerPath {
  title: string;
  whyItFits: string;
  strengths: string[];
  mainGaps: string[];
  recommendedNextSkills: string[];
}

export interface CareerPathsResponse {
  success: boolean;
  data: {
    resumeId: string;
    paths: CareerPath[];
  };
}
