import mongoose from "mongoose";
import { IJob, Job } from "../models/Job";
import { JobApplication, type ApplicationStatus } from "../models/JobApplication";
import { JobFeedback, type JobFeedbackValue } from "../models/JobFeedback";
import { LearningProgress, type LearningStatus } from "../models/LearningProgress";
import { SavedJob } from "../models/SavedJob";
import { User, type IUser } from "../models/User";
import { Resume } from "../models/Resume";
import { analyzeSkillGaps, calculateReadiness } from "./careerIntelligence.service";
import { MatchableJob, normalizeSkill, rankJobs } from "./jobMatching.service";
import { createCareerRoadmap } from "./roadmap.service";

export const isObjectId = (value: unknown): value is string => typeof value === "string" && mongoose.isValidObjectId(value);

export const getUser = (userId: string) => User.findById(userId);

export const saveJob = async (userId: string, jobId: string) => {
  if (!isObjectId(jobId)) throw new Error("INVALID_JOB_ID");
  const job = await Job.findOne({ _id: jobId, isActive: true });
  if (!job) throw new Error("JOB_NOT_FOUND");
  try { return await SavedJob.create({ userId, jobId }); } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new Error("JOB_ALREADY_SAVED");
    throw error;
  }
};

export const removeSavedJob = async (userId: string, jobId: string): Promise<boolean> => {
  if (!isObjectId(jobId)) throw new Error("INVALID_JOB_ID");
  const result = await SavedJob.deleteOne({ userId, jobId });
  return result.deletedCount > 0;
};

export const listSavedJobs = (userId: string) => SavedJob.find({ userId }).sort({ createdAt: -1 }).populate("jobId", "title company location workMode experienceLevel requiredSkills preferredSkills");

export const createApplication = async (userId: string, jobId: string, status: ApplicationStatus) => {
  if (!isObjectId(jobId)) throw new Error("INVALID_JOB_ID");
  if (!(await Job.findOne({ _id: jobId, isActive: true }))) throw new Error("JOB_NOT_FOUND");
  try { return await JobApplication.create({ userId, jobId, status }); } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new Error("APPLICATION_EXISTS");
    throw error;
  }
};

export const updateApplication = async (userId: string, jobId: string, status: ApplicationStatus) => {
  if (!isObjectId(jobId)) throw new Error("INVALID_JOB_ID");
  const application = await JobApplication.findOneAndUpdate({ userId, jobId }, { status }, { new: true, runValidators: true });
  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  return application;
};

export const listApplications = (userId: string) => JobApplication.find({ userId }).sort({ updatedAt: -1 }).populate("jobId", "title company location workMode");

export const setFeedback = async (userId: string, jobId: string, feedback: JobFeedbackValue) => {
  if (!isObjectId(jobId)) throw new Error("INVALID_JOB_ID");
  if (!(await Job.findById(jobId))) throw new Error("JOB_NOT_FOUND");
  return JobFeedback.findOneAndUpdate({ userId, jobId }, { feedback }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
};

export const updateUserPreferences = async (userId: string, update: Record<string, unknown>) => User.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true }).select("-passwordHash");

export const upsertLearningProgress = async (userId: string, skill: string, status: LearningStatus, progress: number) => {
  const normalizedSkill = normalizeSkill(skill);
  return LearningProgress.findOneAndUpdate({ userId, normalizedSkill: normalizedSkill.toLowerCase() }, { skill: normalizedSkill, normalizedSkill: normalizedSkill.toLowerCase(), status, progress }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
};

export const updateLearningProgress = async (userId: string, skill: string, status: LearningStatus, progress: number) => {
  const normalizedSkill = normalizeSkill(skill);
  const existing = await LearningProgress.findOne({ userId, normalizedSkill: normalizedSkill.toLowerCase() });
  if (!existing) throw new Error("LEARNING_NOT_FOUND");
  existing.skill = normalizedSkill;
  existing.status = status;
  existing.progress = progress;
  return existing.save();
};

export interface PersonalizationSignals {
  saved: boolean;
  feedback?: "interested" | "not_interested";
  applied: boolean;
}

type PersonalizationUser = Pick<IUser, "targetRoles" | "preferredIndustries" | "preferredWorkModes"> & { careerGoal?: string };

export const calculatePersonalizationBoost = (user: PersonalizationUser, job: Pick<IJob, "title" | "industry" | "workMode">, signals: PersonalizationSignals) => {
  const reasons: string[] = [];
  let boost = 0;
  const rolePreferences = [...user.targetRoles, ...(user.careerGoal ? [user.careerGoal] : [])].map((value) => value.toLowerCase());
  if (signals.saved) { boost += 3; reasons.push("Job is saved"); }
  if (signals.feedback === "interested") { boost += 5; reasons.push("Marked interested"); }
  if (signals.feedback === "not_interested") { boost -= 8; reasons.push("Marked not interested"); }
  if (rolePreferences.some((role) => job.title.toLowerCase().includes(role) || role.includes(job.title.toLowerCase()))) { boost += 4; reasons.push("Matches your preferred role"); }
  if (user.preferredIndustries.some((industry) => job.industry.toLowerCase().includes(industry.toLowerCase()))) { boost += 3; reasons.push("Matches your preferred industry"); }
  if (user.preferredWorkModes.includes(job.workMode)) { boost += 2; reasons.push("Matches your preferred work mode"); }
  if (signals.applied) { boost -= 2; reasons.push("Already tracked in applications"); }
  const boundedBoost = Math.max(-10, Math.min(10, boost));
  return { boost: boundedBoost, reasons };
};

export const listLearningProgress = (userId: string) => LearningProgress.find({ userId }).sort({ updatedAt: -1 });

export const getPersonalizedRecommendations = async (userId: string, resumeId: string) => {
  const [user, resume] = await Promise.all([
    User.findById(userId),
    Resume.findById(resumeId).select("candidateProfile +candidateEmbedding"),
  ]);
  if (!user) throw new Error("USER_NOT_FOUND");
  if (!resume) throw new Error("RESUME_NOT_FOUND");
  if (!resume.candidateProfile) throw new Error("PROFILE_NOT_FOUND");
  const jobs = await Job.find({ isActive: true }).select("+embedding").lean() as MatchableJob[];
  const [saved, feedback, applications] = await Promise.all([
    SavedJob.find({ userId }).select("jobId"), JobFeedback.find({ userId }), JobApplication.find({ userId }),
  ]);
  const savedIds = new Set(saved.map((item) => String(item.jobId)));
  const feedbackByJob = new Map(feedback.map((item) => [String(item.jobId), item.feedback]));
  const appliedIds = new Set(applications.map((item) => String(item.jobId)));
  const base = rankJobs(resume.candidateProfile, jobs, resume.candidateEmbedding);
  return base.map((recommendation) => {
    const job = jobs.find((item) => String(item._id) === recommendation.jobId);
    if (!job) return { ...recommendation, baseScore: recommendation.matchScore, personalizationBoost: 0, finalScore: recommendation.matchScore, personalization: { boost: 0, reasons: [] } };
    const feedbackValue = feedbackByJob.get(recommendation.jobId);
    const personalization = calculatePersonalizationBoost(user, job, { saved: savedIds.has(recommendation.jobId), ...(feedbackValue ? { feedback: feedbackValue } : {}), applied: appliedIds.has(recommendation.jobId) });
    return { ...recommendation, baseScore: recommendation.matchScore, personalizationBoost: personalization.boost, finalScore: Math.max(0, Math.min(100, recommendation.matchScore + personalization.boost)), personalization };
  }).sort((left, right) => right.finalScore - left.finalScore);
};

export const getPersonalizedSkillGaps = async (userId: string, resumeId: string) => {
  const resume = await Resume.findById(resumeId).select("candidateProfile");
  if (!resume) throw new Error("RESUME_NOT_FOUND");
  if (!resume.candidateProfile) throw new Error("PROFILE_NOT_FOUND");
  const jobs = await Job.find({ isActive: true }).lean() as MatchableJob[];
  const [progress, gaps] = await Promise.all([listLearningProgress(userId), Promise.resolve(analyzeSkillGaps(resume.candidateProfile, jobs))]);
  const progressBySkill = new Map(progress.map((item) => [item.normalizedSkill, item]));
  return gaps.gaps.map((gap) => {
    const item = progressBySkill.get(normalizeSkill(gap.skill).toLowerCase());
    return { ...gap, status: item?.status || "planned", progress: item?.progress || 0 };
  }).filter((gap) => gap.status !== "completed");
};

export const getProgressRoadmap = async (userId: string, resumeId: string) => {
  const context = await getPersonalizedRecommendations(userId, resumeId);
  const resume = await Resume.findById(resumeId).select("candidateProfile");
  if (!resume?.candidateProfile) throw new Error("PROFILE_NOT_FOUND");
  const gaps = await getPersonalizedSkillGaps(userId, resumeId);
  const readiness = calculateReadiness(resume.candidateProfile, context);
  const progress = await listLearningProgress(userId);
  const roadmap = createCareerRoadmap(resume.candidateProfile, readiness, gaps, context);
  return { ...roadmap, progress: { completed: progress.filter((item) => item.status === "completed").map((item) => item.skill), learning: progress.filter((item) => item.status === "learning").map((item) => ({ skill: item.skill, progress: item.progress })), remainingPrioritySkills: gaps.filter((gap) => gap.priority === "HIGH").map((gap) => gap.skill) } };
};
