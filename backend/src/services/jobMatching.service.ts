import { IJob } from "../models/Job";
import { CandidateProfile } from "../types/candidateProfile";
import { similarityScore } from "../utils/vector.util";

export const MATCH_WEIGHTS = {
  skill: 0.45,
  semantic: 0.25,
  experience: 0.2,
  role: 0.1,
} as const;

export interface JobRecommendation {
  jobId: string;
  title: string;
  company: string;
  location: string;
  workMode: IJob["workMode"];
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

export type MatchableJob = IJob & { _id?: unknown; embedding?: number[] };

const SKILL_ALIASES: Record<string, string> = {
  javascript: "JavaScript",
  js: "JavaScript",
  node: "Node.js",
  nodejs: "Node.js",
  nodejsruntime: "Node.js",
  react: "React.js",
  reactjs: "React.js",
  mongodb: "MongoDB",
  mongo: "MongoDB",
  sql: "SQL",
  python: "Python",
  typescript: "TypeScript",
  ts: "TypeScript",
  java: "Java",
  machinelearning: "Machine Learning",
  ml: "Machine Learning",
};

const skillKey = (skill: string): string => skill.trim().toLowerCase().replace(/[^a-z0-9+#]+/g, "");

export const normalizeSkill = (skill: string): string => {
  const trimmed = skill.trim();
  return SKILL_ALIASES[skillKey(trimmed)] || trimmed.replace(/\s+/g, " ");
};

const uniqueSkills = (skills: string[] = []): string[] => {
  const seen = new Set<string>();
  return skills.reduce<string[]>((result, skill) => {
    if (!skill.trim()) return result;
    const normalized = normalizeSkill(skill);
    const key = skillKey(normalized);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
    return result;
  }, []);
};

const finiteExperience = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;

export const calculateExperienceMatch = (candidateYears: number, job: Pick<IJob, "minExperience" | "maxExperience" | "experienceLevel">): number => {
  const years = finiteExperience(candidateYears, 0);
  const minimum = finiteExperience(job.minExperience, 0);
  const maximum = Math.max(minimum, finiteExperience(job.maxExperience, minimum));
  const level = job.experienceLevel;

  if (years >= minimum && years <= maximum) return 100;
  if (years === 0 && (level === "intern" || level === "entry")) return minimum <= 1 ? 100 : 85;
  if (years < minimum) return Math.max(0, Math.round(100 - (minimum - years) * (level === "entry" || level === "intern" ? 20 : 25)));
  return Math.max(0, Math.round(100 - (years - maximum) * 10));
};

const roleTokens = (value: string): string[] => value.toLowerCase().match(/[a-z0-9]+/g) || [];

export const calculateRoleMatch = (candidate: CandidateProfile, jobTitle: string): number => {
  const titleTokens = new Set(roleTokens(jobTitle).filter((token) => token.length > 2));
  if (!titleTokens.size) return 50;

  const targetRoles = candidate.targetRoles || [];
  const experience = candidate.experience || [];
  const targetRoleText = targetRoles.join(" ");
  if (targetRoles.some((role) => role.trim().toLowerCase() === jobTitle.trim().toLowerCase())) return 100;
  const experienceRoleText = experience.map((entry) => entry.role || "").join(" ");
  const signalText = `${targetRoleText} ${experienceRoleText} ${candidate.summary || ""}`;
  const signalTokens = new Set(roleTokens(signalText).filter((token) => token.length > 2));
  const overlap = [...titleTokens].filter((token) => signalTokens.has(token)).length;

  if (!signalText.trim()) return 50;
  if (targetRoleText.trim() && roleTokens(targetRoleText).some((token) => titleTokens.has(token))) return Math.min(100, 70 + overlap * 10);
  return Math.min(100, Math.round((overlap / titleTokens.size) * 100));
};

interface SkillMatch {
  matchedSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  requiredSkillScore: number;
}

const calculateSkillMatch = (candidate: CandidateProfile, job: MatchableJob): SkillMatch => {
  const candidateSkills = new Set(uniqueSkills([
    ...(candidate.skills || []),
    ...(candidate.experience || []).flatMap((entry) => entry.skills || []),
    ...(candidate.projects || []).flatMap((project) => project.technologies || []),
  ]).map(skillKey));
  const requiredSkills = uniqueSkills(job.requiredSkills || []);
  const preferredSkills = uniqueSkills(job.preferredSkills || []);
  const matchedRequired = requiredSkills.filter((skill) => candidateSkills.has(skillKey(skill)));
  const matchedPreferred = preferredSkills.filter((skill) => candidateSkills.has(skillKey(skill)));

  return {
    matchedSkills: matchedRequired,
    missingRequiredSkills: requiredSkills.filter((skill) => !candidateSkills.has(skillKey(skill))),
    matchedPreferredSkills: matchedPreferred,
    missingPreferredSkills: preferredSkills.filter((skill) => !candidateSkills.has(skillKey(skill))),
    requiredSkillScore: requiredSkills.length ? (matchedRequired.length / requiredSkills.length) * 100 : 100,
  };
};

export const matchJob = (candidate: CandidateProfile, job: MatchableJob, candidateEmbedding?: number[]): JobRecommendation => {
  const skillMatch = calculateSkillMatch(candidate, job);
  const experienceMatch = calculateExperienceMatch(candidate.totalExperience, job);
  const roleMatch = calculateRoleMatch(candidate, job.title);
  const semanticSimilarity = similarityScore(candidateEmbedding, job.embedding);
  const matchScore = Math.round(
    skillMatch.requiredSkillScore * MATCH_WEIGHTS.skill
      + semanticSimilarity * MATCH_WEIGHTS.semantic
      + experienceMatch * MATCH_WEIGHTS.experience
      + roleMatch * MATCH_WEIGHTS.role,
  );

  return {
    jobId: String(job._id || ""),
    title: job.title,
    company: job.company,
    location: job.location,
    workMode: job.workMode,
    matchScore: Math.max(0, Math.min(100, matchScore)),
    skillMatchScore: Math.round(skillMatch.requiredSkillScore),
    semanticSimilarityScore: semanticSimilarity,
    experienceMatchScore: experienceMatch,
    roleMatchScore: roleMatch,
    matchedSkills: skillMatch.matchedSkills,
    missingRequiredSkills: skillMatch.missingRequiredSkills,
    matchedPreferredSkills: skillMatch.matchedPreferredSkills,
    missingPreferredSkills: skillMatch.missingPreferredSkills,
    experienceMatch,
    roleMatch,
  };
};

export const rankJobs = (candidate: CandidateProfile, jobs: MatchableJob[], candidateEmbedding?: number[]): JobRecommendation[] =>
  jobs
    .map((job) => matchJob(candidate, job, candidateEmbedding))
    .sort((left, right) => right.matchScore - left.matchScore);
