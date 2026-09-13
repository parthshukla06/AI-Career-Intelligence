import { Request, Response } from "express";
import { APPLICATION_STATUSES, type ApplicationStatus } from "../models/JobApplication";
import { JOB_FEEDBACK_VALUES, type JobFeedbackValue } from "../models/JobFeedback";
import { LEARNING_STATUSES, type LearningStatus } from "../models/LearningProgress";
import { EXPERIENCE_LEVELS, WORK_MODES } from "../models/Job";
import { Resume } from "../models/Resume";
import { User } from "../models/User";
import { calculateReadiness } from "../services/careerIntelligence.service";
import { getCareerContextForResume } from "../services/careerContext.service";
import { createApplication, getPersonalizedRecommendations, getPersonalizedSkillGaps, getProgressRoadmap, listApplications, listLearningProgress, listSavedJobs, removeSavedJob, saveJob, setFeedback, updateApplication, updateUserPreferences, updateLearningProgress, upsertLearningProgress } from "../services/user.service";
import { isObjectId } from "../services/user.service";

const currentUserId = (req: Request): string => req.userId as string;
const pathParam = (value: string | string[] | undefined): string => typeof value === "string" ? value : "";
const errorStatus: Record<string, number> = { INVALID_JOB_ID: 400, JOB_NOT_FOUND: 404, JOB_ALREADY_SAVED: 409, APPLICATION_EXISTS: 409, APPLICATION_NOT_FOUND: 404, RESUME_NOT_FOUND: 404, PROFILE_NOT_FOUND: 422, USER_NOT_FOUND: 404, LEARNING_NOT_FOUND: 404 };
const sendServiceError = (res: Response, error: unknown): void => {
  const code = error instanceof Error ? error.message : "";
  res.status(errorStatus[code] || 500).json({ success: false, message: errorStatus[code] ? code.split("_").join(" ") : "Unable to process request" });
};

export const save = async (req: Request, res: Response): Promise<void> => { try { res.status(201).json({ success: true, data: await saveJob(currentUserId(req), pathParam(req.params.jobId)) }); } catch (error) { sendServiceError(res, error); } };
export const removeSave = async (req: Request, res: Response): Promise<void> => { try { const removed = await removeSavedJob(currentUserId(req), pathParam(req.params.jobId)); if (!removed) { res.status(404).json({ success: false, message: "Saved job not found" }); return; } res.status(200).json({ success: true, message: "Saved job removed" }); } catch (error) { sendServiceError(res, error); } };
export const saved = async (req: Request, res: Response): Promise<void> => { try { res.status(200).json({ success: true, data: await listSavedJobs(currentUserId(req)) }); } catch (error) { sendServiceError(res, error); } };

export const application = async (req: Request, res: Response): Promise<void> => { const status = req.body?.status; if (!APPLICATION_STATUSES.includes(status as ApplicationStatus)) { res.status(400).json({ success: false, message: "Invalid application status" }); return; } try { res.status(201).json({ success: true, data: await createApplication(currentUserId(req), req.body?.jobId, status) }); } catch (error) { sendServiceError(res, error); } };
export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => { const status = req.body?.status; if (!APPLICATION_STATUSES.includes(status as ApplicationStatus)) { res.status(400).json({ success: false, message: "Invalid application status" }); return; } try { res.status(200).json({ success: true, data: await updateApplication(currentUserId(req), pathParam(req.params.jobId), status) }); } catch (error) { sendServiceError(res, error); } };
export const applications = async (req: Request, res: Response): Promise<void> => { try { res.status(200).json({ success: true, data: await listApplications(currentUserId(req)) }); } catch (error) { sendServiceError(res, error); } };
export const feedback = async (req: Request, res: Response): Promise<void> => { const value = req.body?.feedback; if (!JOB_FEEDBACK_VALUES.includes(value as JobFeedbackValue)) { res.status(400).json({ success: false, message: "Invalid job feedback" }); return; } try { res.status(200).json({ success: true, data: await setFeedback(currentUserId(req), pathParam(req.params.jobId), value) }); } catch (error) { sendServiceError(res, error); } };

export const careerGoal = async (req: Request, res: Response): Promise<void> => {
  const update: Record<string, unknown> = {};
  if (typeof req.body?.careerGoal === "string" && req.body.careerGoal.trim()) update.careerGoal = req.body.careerGoal.trim().slice(0, 200);
  if (Array.isArray(req.body?.targetRoles)) update.targetRoles = req.body.targetRoles.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim()).filter(Boolean).slice(0, 20);
  if (Array.isArray(req.body?.preferredIndustries)) update.preferredIndustries = req.body.preferredIndustries.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim()).filter(Boolean).slice(0, 20);
  if (Array.isArray(req.body?.preferredLocations)) update.preferredLocations = req.body.preferredLocations.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim()).filter(Boolean).slice(0, 20);
  if (Array.isArray(req.body?.preferredWorkModes) && req.body.preferredWorkModes.every((value: unknown) => WORK_MODES.includes(value as typeof WORK_MODES[number]))) update.preferredWorkModes = req.body.preferredWorkModes;
  if (typeof req.body?.experienceLevel === "string" && EXPERIENCE_LEVELS.includes(req.body.experienceLevel as typeof EXPERIENCE_LEVELS[number])) update.experienceLevel = req.body.experienceLevel;
  if (Array.isArray(req.body?.learningGoals)) update.learningGoals = req.body.learningGoals.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim()).filter(Boolean).slice(0, 20);
  if (req.body?.resumeId !== undefined) { if (!isObjectId(req.body.resumeId)) { res.status(400).json({ success: false, message: "Invalid resume id" }); return; } update.resumeId = req.body.resumeId; }
  if (!Object.keys(update).length) { res.status(400).json({ success: false, message: "At least one valid preference is required" }); return; }
  try { const result = await updateUserPreferences(currentUserId(req), update); res.status(200).json({ success: true, data: result }); } catch (error) { sendServiceError(res, error); }
};

const validProgress = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
export const learning = async (req: Request, res: Response): Promise<void> => { const skill = typeof req.body?.skill === "string" ? req.body.skill.trim() : ""; const status = req.body?.status; const progress = req.body?.progress; if (!skill || !LEARNING_STATUSES.includes(status as LearningStatus) || !validProgress(progress)) { res.status(400).json({ success: false, message: "skill, valid status, and integer progress from 0 to 100 are required" }); return; } try { res.status(201).json({ success: true, data: await upsertLearningProgress(currentUserId(req), skill, status, progress) }); } catch (error) { sendServiceError(res, error); } };
export const updateLearning = async (req: Request, res: Response): Promise<void> => { const skill = decodeURIComponent(pathParam(req.params.skill)).trim(); const status = req.body?.status; const progress = req.body?.progress; if (!skill || !LEARNING_STATUSES.includes(status as LearningStatus) || !validProgress(progress)) { res.status(400).json({ success: false, message: "valid status and integer progress from 0 to 100 are required" }); return; } try { res.status(200).json({ success: true, data: await updateLearningProgress(currentUserId(req), skill, status, progress) }); } catch (error) { sendServiceError(res, error); } };
export const learningProgress = async (req: Request, res: Response): Promise<void> => { try { res.status(200).json({ success: true, data: await listLearningProgress(currentUserId(req)) }); } catch (error) { sendServiceError(res, error); } };

export const personalized = async (req: Request, res: Response): Promise<void> => { if (!isObjectId(req.params.resumeId)) { res.status(400).json({ success: false, message: "Invalid resume id" }); return; } try { res.status(200).json({ success: true, data: { resumeId: req.params.resumeId, recommendations: await getPersonalizedRecommendations(currentUserId(req), req.params.resumeId) } }); } catch (error) { sendServiceError(res, error); } };
export const personalizedGaps = async (req: Request, res: Response): Promise<void> => { if (!isObjectId(req.params.resumeId)) { res.status(400).json({ success: false, message: "Invalid resume id" }); return; } try { res.status(200).json({ success: true, data: { resumeId: req.params.resumeId, gaps: await getPersonalizedSkillGaps(currentUserId(req), req.params.resumeId) } }); } catch (error) { sendServiceError(res, error); } };
export const progressRoadmap = async (req: Request, res: Response): Promise<void> => { if (!isObjectId(req.params.resumeId)) { res.status(400).json({ success: false, message: "Invalid resume id" }); return; } try { res.status(200).json({ success: true, data: { resumeId: req.params.resumeId, roadmap: await getProgressRoadmap(currentUserId(req), req.params.resumeId) } }); } catch (error) { sendServiceError(res, error); } };

export const dashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(currentUserId(req)).select("-passwordHash");
    if (!user) { res.status(404).json({ success: false, message: "User not found" }); return; }
    const [savedJobs, applications, progress] = await Promise.all([listSavedJobs(currentUserId(req)), listApplications(currentUserId(req)), listLearningProgress(currentUserId(req))]);
    let topRecommendations: Awaited<ReturnType<typeof getPersonalizedRecommendations>> = [];
    let topSkillGaps: Awaited<ReturnType<typeof getPersonalizedSkillGaps>> = [];
    let readiness: ReturnType<typeof calculateReadiness> | null = null;
    if (user.resumeId) {
      try {
        topRecommendations = await getPersonalizedRecommendations(currentUserId(req), String(user.resumeId));
        topSkillGaps = await getPersonalizedSkillGaps(currentUserId(req), String(user.resumeId));
        const resume = await Resume.findById(user.resumeId).select("candidateProfile +candidateEmbedding");
        const context = resume ? await getCareerContextForResume(resume) : undefined;
        readiness = context && resume?.candidateProfile ? calculateReadiness(resume.candidateProfile, context.recommendations) : null;
      } catch (error) { console.error("Dashboard resume context failed", { errorType: error instanceof Error ? error.name : "UnknownError" }); }
    }
    const nextActions = topSkillGaps.slice(0, 3).map((gap) => `Learn ${gap.skill}`);
    if (topRecommendations[0]) nextActions.push(`Apply to ${topRecommendations[0].title} roles`);
    res.status(200).json({ success: true, data: { profile: user, careerGoal: { careerGoal: user.careerGoal || null, targetRoles: user.targetRoles }, topRecommendations: topRecommendations.slice(0, 5), savedJobsCount: savedJobs.length, applicationsCount: applications.length, learningProgress: progress.slice(0, 20), topSkillGaps: topSkillGaps.slice(0, 5), readiness, nextActions: nextActions.slice(0, 5) } });
  } catch (error) { sendServiceError(res, error); }
};
