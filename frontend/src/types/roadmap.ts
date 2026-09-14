export interface CareerRoadmapStage {
  phase: number;
  title: string;
  skills: string[];
  projects: string[];
  interviewPreparation: string[];
}

export interface CareerRoadmap {
  currentLevel: "Beginner" | "Developing" | "Job Ready";
  targetRole: string;
  prioritySkills: string[];
  stages: CareerRoadmapStage[];
}

export interface RoadmapResponse {
  success: boolean;
  data: {
    resumeId: string;
    roadmap: CareerRoadmap;
  };
}
