import { IJob } from "../models/Job";
import { CandidateProfile } from "../types/candidateProfile";
import { JobRecommendation, MatchableJob, normalizeSkill, rankJobs } from "./jobMatching.service";

export interface ExplainableRecommendation {
  jobId: string;
  title: string;
  company: string;
  location: string;
  workMode: IJob["workMode"];
  overallScore: number;
  skillMatchScore: number;
  semanticScore: number;
  experienceMatchScore: number;
  roleMatchScore: number;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  experienceAssessment: string;
  roleAssessment: string;
  explanation: {
    whyGoodMatch: string[];
    keySkillGaps: string[];
    experienceGap: string;
    recommendedNextSteps: string[];
  };
  whyNot?: {
    score: number;
    reasons: string[];
    improvements: string[];
  };
}

export interface CareerContext {
  recommendations: JobRecommendation[];
  jobs: MatchableJob[];
}

const unique = (values: string[]): string[] => [...new Set(values)];

const experienceAssessment = (score: number): string => {
  if (score >= 80) return "Experience is a strong fit for this role.";
  if (score >= 50) return "Experience is a partial fit; additional relevant experience would help.";
  return "This role expects more experience than the candidate currently demonstrates.";
};

const roleAssessment = (score: number): string => {
  if (score >= 80) return "The role aligns closely with the candidate's stated or demonstrated direction.";
  if (score >= 50) return "The role has some alignment with the candidate's profile.";
  return "The role has limited alignment with the candidate's stated or demonstrated direction.";
};

const recommendationNextSteps = (recommendation: JobRecommendation): string[] => {
  const nextSteps = recommendation.missingRequiredSkills.slice(0, 3).map((skill) => `Build evidence with ${skill}`);
  if (recommendation.experienceMatchScore < 50) nextSteps.push("Gain relevant hands-on experience through internships or production-style projects");
  if (recommendation.roleMatchScore < 50) nextSteps.push("Clarify and demonstrate interest in this role through targeted projects");
  return nextSteps.slice(0, 4);
};

export const explainRecommendation = (recommendation: JobRecommendation): ExplainableRecommendation => {
  const reasons: string[] = [];
  const improvements: string[] = [];
  if (recommendation.missingRequiredSkills.length) {
    recommendation.missingRequiredSkills.slice(0, 3).forEach((skill) => {
      reasons.push(`Missing required skill: ${skill}`);
      improvements.push(`Learn ${skill}`);
    });
  }
  if (recommendation.experienceMatchScore < 50) {
    reasons.push("Experience level is higher than the candidate's experience");
    improvements.push("Gain relevant experience through internships or production-style projects");
  }
  if (recommendation.roleMatchScore < 50) {
    reasons.push("Low role compatibility");
    improvements.push("Build a project or portfolio evidence aligned with this role");
  }

  const whyGoodMatch = [
    recommendation.skillMatchScore >= 60 ? `Matches ${recommendation.matchedSkills.length} required skill(s)` : "Some required skills are already present",
    recommendation.experienceMatchScore >= 80 ? "Experience level is compatible" : "The role may be accessible with additional experience",
    recommendation.semanticSimilarityScore >= 60 ? "Career profile has strong semantic alignment" : "Some profile concepts align with the role",
  ];

  return {
    jobId: recommendation.jobId,
    title: recommendation.title,
    company: recommendation.company,
    location: recommendation.location,
    workMode: recommendation.workMode,
    overallScore: recommendation.matchScore,
    skillMatchScore: recommendation.skillMatchScore,
    semanticScore: recommendation.semanticSimilarityScore,
    experienceMatchScore: recommendation.experienceMatchScore,
    roleMatchScore: recommendation.roleMatchScore,
    matchedRequiredSkills: recommendation.matchedSkills,
    missingRequiredSkills: recommendation.missingRequiredSkills,
    matchedPreferredSkills: recommendation.matchedPreferredSkills,
    missingPreferredSkills: recommendation.missingPreferredSkills,
    experienceAssessment: experienceAssessment(recommendation.experienceMatchScore),
    roleAssessment: roleAssessment(recommendation.roleMatchScore),
    explanation: {
      whyGoodMatch,
      keySkillGaps: recommendation.missingRequiredSkills,
      experienceGap: recommendation.experienceMatchScore < 50 ? "The candidate is below the role's expected experience range." : "No significant experience gap detected.",
      recommendedNextSteps: recommendationNextSteps(recommendation),
    },
    ...(recommendation.matchScore < 50 ? { whyNot: { score: recommendation.matchScore, reasons, improvements } } : {}),
  };
};

export const createCareerContext = (candidate: CandidateProfile, jobs: MatchableJob[], candidateEmbedding?: number[]): CareerContext => ({
  recommendations: rankJobs(candidate, jobs, candidateEmbedding),
  jobs,
});

export interface SkillGap {
  skill: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  demand: number;
  matchedJobs: number;
  missingInJobs: number;
  reason: string;
}

export const analyzeSkillGaps = (candidate: CandidateProfile, jobs: MatchableJob[]): { candidateSkills: string[]; gaps: SkillGap[] } => {
  const candidateSkillValues = [
    ...candidate.skills,
    ...(candidate.experience || []).flatMap((entry) => entry.skills || []),
    ...(candidate.projects || []).flatMap((project) => project.technologies || []),
  ];
  const candidateKeys = new Set(candidateSkillValues.map((skill) => normalizeSkill(skill).toLowerCase()));
  const relevantJobs = jobs.filter((job) => job.isActive !== false);
  const records = new Map<string, { skill: string; required: number; preferred: number; matchedJobs: number; missingInJobs: number }>();

  relevantJobs.forEach((job) => {
    const required = unique((job.requiredSkills || []).map(normalizeSkill));
    const preferred = unique((job.preferredSkills || []).map(normalizeSkill));
    unique([...required, ...preferred]).forEach((skill) => {
      const key = skill.toLowerCase();
      const record = records.get(key) || { skill, required: 0, preferred: 0, matchedJobs: 0, missingInJobs: 0 };
      if (required.some((item) => item.toLowerCase() === key)) record.required += 1;
      if (preferred.some((item) => item.toLowerCase() === key)) record.preferred += 1;
      if (candidateKeys.has(key)) record.matchedJobs += 1;
      else record.missingInJobs += 1;
      records.set(key, record);
    });
  });

  const gaps = [...records.values()]
    .filter((record) => !candidateKeys.has(record.skill.toLowerCase()))
    .map((record) => {
      const highThreshold = Math.max(2, Math.ceil(relevantJobs.length * 0.4));
      const priority = record.required >= highThreshold ? "HIGH" : record.preferred >= 2 ? "MEDIUM" : "LOW";
      return {
        skill: record.skill,
        priority,
        demand: record.required + record.preferred,
        matchedJobs: record.matchedJobs,
        missingInJobs: record.missingInJobs,
        reason: priority === "HIGH" ? "Frequently required by relevant jobs" : priority === "MEDIUM" ? "Useful as a preferred skill across multiple relevant jobs" : "Appears less frequently or mainly as a preferred skill",
      } satisfies SkillGap;
    })
    .sort((left, right) => right.demand - left.demand || left.skill.localeCompare(right.skill));

  return { candidateSkills: unique(candidateSkillValues.map(normalizeSkill)), gaps };
};

export interface SkillDemand {
  skill: string;
  demandCount: number;
  requiredCount: number;
  preferredCount: number;
}

export const analyzeSkillDemand = (jobs: MatchableJob[]): SkillDemand[] => {
  const demand = new Map<string, SkillDemand>();
  jobs.forEach((job) => {
    if (job.isActive === false) return;
    unique((job.requiredSkills || []).map(normalizeSkill)).forEach((skill) => {
      const key = skill.toLowerCase();
      const current = demand.get(key) || { skill, demandCount: 0, requiredCount: 0, preferredCount: 0 };
      current.demandCount += 1;
      current.requiredCount += 1;
      demand.set(key, current);
    });
    unique((job.preferredSkills || []).map(normalizeSkill)).forEach((skill) => {
      const key = skill.toLowerCase();
      const current = demand.get(key) || { skill, demandCount: 0, requiredCount: 0, preferredCount: 0 };
      if (!(job.requiredSkills || []).some((required) => normalizeSkill(required).toLowerCase() === key)) current.demandCount += 1;
      current.preferredCount += 1;
      demand.set(key, current);
    });
  });
  return [...demand.values()].sort((left, right) => right.demandCount - left.demandCount || left.skill.localeCompare(right.skill));
};

export const categorizeExperienceRecommendations = (recommendations: JobRecommendation[]) => ({
  strongFit: recommendations.filter((recommendation) => recommendation.experienceMatchScore >= 75),
  possibleFit: recommendations.filter((recommendation) => recommendation.experienceMatchScore >= 50 && recommendation.experienceMatchScore < 75),
  stretchRole: recommendations.filter((recommendation) => recommendation.experienceMatchScore < 50),
});

export const calculateReadiness = (candidate: CandidateProfile, recommendations: JobRecommendation[]) => {
  const top = recommendations.slice(0, 10);
  const average = (values: number[]): number => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const skill = average(top.map((recommendation) => recommendation.skillMatchScore));
  const experience = average(top.map((recommendation) => recommendation.experienceMatchScore));
  const semantic = average(top.map((recommendation) => recommendation.semanticSimilarityScore));
  const role = average(top.map((recommendation) => recommendation.roleMatchScore));
  const projectCount = candidate.projects?.length || 0;
  const projectEvidence = projectCount >= 2 ? 100 : projectCount === 1 ? 60 : 0;
  const score = Math.max(0, Math.min(100, Math.round(skill * 0.35 + experience * 0.25 + semantic * 0.2 + role * 0.1 + projectEvidence * 0.1)));
  const level: "Job Ready" | "Developing" | "Beginner" = score >= 70 ? "Job Ready" : score >= 40 ? "Developing" : "Beginner";
  const strengths = [skill >= 60 ? "Relevant technical skills" : "A foundation of transferable skills", semantic >= 60 ? "Strong conceptual alignment with available roles" : "Some alignment with available roles", projectEvidence >= 60 ? "Project evidence" : "Potential to build project evidence"].slice(0, 3);
  const gaps = [skill < 60 ? "Required skill coverage" : "Preferred skill depth", experience < 60 ? "Professional experience" : "Role-specific experience", role < 50 ? "Role targeting" : "Broader role alignment"];
  const nextActions = [skill < 60 ? "Prioritize high-demand missing skills" : "Add depth in preferred skills", experience < 60 ? "Gain relevant hands-on experience" : "Document measurable outcomes", projectEvidence < 60 ? "Build another production-style project" : "Strengthen project impact statements"];
  return { score, level, strengths, gaps, nextActions };
};

export const simulateSkills = (candidate: CandidateProfile, addedSkills: string[], jobs: MatchableJob[], candidateEmbedding?: number[]) => {
  const simulatedCandidate: CandidateProfile = {
    ...candidate,
    skills: unique([...(candidate.skills || []), ...addedSkills.map(normalizeSkill)]),
    experience: candidate.experience || [],
    projects: candidate.projects || [],
  };
  const before = rankJobs(candidate, jobs, candidateEmbedding);
  const after = rankJobs(simulatedCandidate, jobs, candidateEmbedding);
  const beforeById = new Map(before.map((recommendation) => [recommendation.jobId, recommendation]));
  return {
    addedSkills: unique(addedSkills.map(normalizeSkill)),
    before,
    after,
    improvements: after
      .map((recommendation) => ({ jobId: recommendation.jobId, jobTitle: recommendation.title, oldScore: beforeById.get(recommendation.jobId)?.matchScore || 0, newScore: recommendation.matchScore, improvement: recommendation.matchScore - (beforeById.get(recommendation.jobId)?.matchScore || 0) }))
      .filter((item) => item.improvement > 0)
      .sort((left, right) => right.improvement - left.improvement),
  };
};