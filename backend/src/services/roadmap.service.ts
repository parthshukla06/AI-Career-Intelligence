import { CandidateProfile } from "../types/candidateProfile";
import { JobRecommendation } from "./jobMatching.service";
import { SkillGap } from "./careerIntelligence.service";

export interface CareerRoadmap {
  currentLevel: "Beginner" | "Developing" | "Job Ready";
  targetRole: string;
  prioritySkills: string[];
  stages: Array<{ phase: number; title: string; skills: string[]; projects: string[]; interviewPreparation: string[] }>;
}

export const createCareerRoadmap = (candidate: CandidateProfile, readiness: { level: CareerRoadmap["currentLevel"] }, gaps: SkillGap[], recommendations: JobRecommendation[]): CareerRoadmap => {
  const targetRole = candidate.targetRoles[0] || recommendations[0]?.title || "Software Engineer";
  const prioritySkills = gaps.filter((gap) => gap.priority === "HIGH").slice(0, 6).map((gap) => gap.skill);
  const secondarySkills = gaps.filter((gap) => gap.priority !== "HIGH").slice(0, 5).map((gap) => gap.skill);
  return {
    currentLevel: readiness.level,
    targetRole,
    prioritySkills,
    stages: [
      {
        phase: 1,
        title: "Strengthen foundations",
        skills: candidate.skills.length ? ["Data structures", "Testing", ...secondarySkills.slice(0, 2)] : ["Programming fundamentals", "Data structures", "Git"],
        projects: candidate.projects.length ? ["Refine an existing project with tests and clear documentation"] : ["Build a small complete application with version control"],
        interviewPreparation: ["Explain programming fundamentals", "Practice problem solving"],
      },
      {
        phase: 2,
        title: "Build role-aligned depth",
        skills: prioritySkills.length ? prioritySkills : ["HTTP and REST APIs", "Databases", "Application testing"],
        projects: [`Build a ${targetRole.toLowerCase()} project using the priority skills`],
        interviewPreparation: ["Walk through project decisions", "Practice role-specific fundamentals"],
      },
      {
        phase: 3,
        title: "Demonstrate job readiness",
        skills: ["Debugging", "System design fundamentals", "Deployment basics"],
        projects: ["Deploy and document one production-style project with monitoring and error handling"],
        interviewPreparation: ["Practice behavioral examples", "Review target-job requirements", "Conduct mock interviews"],
      },
    ],
  };
};
