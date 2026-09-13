import { Request, Response } from "express";
import mongoose from "mongoose";
import { Job } from "../models/Job";
import { Resume } from "../models/Resume";
import {
  analyzeSkillDemand,
  analyzeSkillGaps,
  calculateReadiness,
  categorizeExperienceRecommendations,
  createCareerContext,
  explainRecommendation,
  simulateSkills,
} from "../services/careerIntelligence.service";

const loadContext = async (resumeId: string) => {
  const resume = await Resume.findById(resumeId).select("candidateProfile +candidateEmbedding");
  if (!resume) return { error: { status: 404, message: "Resume not found" } } as const;
  if (!resume.candidateProfile) return { error: { status: 422, message: "Resume does not have an analyzed candidate profile" } } as const;
  const jobs = await Job.find({ isActive: true }).select("+embedding").lean();
  return { context: createCareerContext(resume.candidateProfile, jobs, resume.candidateEmbedding), candidate: resume.candidateProfile, candidateEmbedding: resume.candidateEmbedding } as const;
};

const sendResumeError = (res: Response, resumeId: unknown): string | undefined => {
  if (typeof resumeId !== "string" || !mongoose.isValidObjectId(resumeId)) {
    res.status(400).json({ success: false, message: "Invalid resume id" });
    return undefined;
  }
  return resumeId;
};

const handleContext = async (res: Response, resumeId: string, callback: (loaded: Awaited<ReturnType<typeof loadContext>> & { context: NonNullable<Awaited<ReturnType<typeof loadContext>>["context"]> }) => Promise<void> | void): Promise<void> => {
  try {
    const loaded = await loadContext(resumeId);
    if ("error" in loaded) {
      res.status(loaded.error.status).json({ success: false, message: loaded.error.message });
      return;
    }
    await callback(loaded as never);
  } catch (error) {
    console.error("Career intelligence request failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
      stack: error instanceof Error ? error.stack?.split("\n").slice(0, 4).join("\n") : undefined,
    });
    res.status(500).json({ success: false, message: "Unable to generate career intelligence" });
  }
};

export const getCareerOverview = async (req: Request, res: Response): Promise<void> => {
  const resumeId = sendResumeError(res, req.params.resumeId);
  if (!resumeId) return;
  await handleContext(res, resumeId, ({ context, candidate }) => {
    const recommendations = context.recommendations.slice(0, 10);
    res.status(200).json({
      success: true,
      data: {
        resumeId,
        recommendations: recommendations.map(explainRecommendation),
        skillGaps: analyzeSkillGaps(candidate, context.jobs).gaps.slice(0, 20),
        readiness: calculateReadiness(candidate, recommendations),
        experienceRecommendations: categorizeExperienceRecommendations(recommendations),
      },
    });
  });
};

export const getSkillGaps = async (req: Request, res: Response): Promise<void> => {
  const resumeId = sendResumeError(res, req.params.resumeId);
  if (!resumeId) return;
  await handleContext(res, resumeId, ({ context, candidate }) => {
    res.status(200).json({ success: true, data: { resumeId, ...analyzeSkillGaps(candidate, context.jobs) } });
  });
};

export const getReadiness = async (req: Request, res: Response): Promise<void> => {
  const resumeId = sendResumeError(res, req.params.resumeId);
  if (!resumeId) return;
  await handleContext(res, resumeId, ({ context, candidate }) => {
    res.status(200).json({ success: true, data: { resumeId, readiness: calculateReadiness(candidate, context.recommendations) } });
  });
};

export const getExperienceRecommendations = async (req: Request, res: Response): Promise<void> => {
  const resumeId = sendResumeError(res, req.params.resumeId);
  if (!resumeId) return;
  await handleContext(res, resumeId, ({ context }) => {
    res.status(200).json({ success: true, data: { resumeId, ...categorizeExperienceRecommendations(context.recommendations.slice(0, 10)) } });
  });
};

export const getSkillDemand = async (req: Request, res: Response): Promise<void> => {
  try {
    const industry = typeof req.query.industry === "string" ? req.query.industry.trim() : "";
    const experienceLevel = typeof req.query.experienceLevel === "string" ? req.query.experienceLevel.trim() : "";
    if (req.query.industry !== undefined && !industry || req.query.experienceLevel !== undefined && !experienceLevel) {
      res.status(400).json({ success: false, message: "Query parameters must not be empty" });
      return;
    }
    const filters: Record<string, unknown> = { isActive: true };
    if (industry) filters.industry = { $regex: industry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (experienceLevel) filters.experienceLevel = experienceLevel;
    const jobs = await Job.find(filters).lean();
    res.status(200).json({ success: true, data: { filters: { industry: industry || null, experienceLevel: experienceLevel || null }, skills: analyzeSkillDemand(jobs) } });
  } catch (error) {
    console.error("Failed to generate skill demand:", error);
    res.status(500).json({ success: false, message: "Unable to generate skill demand" });
  }
};

export const getWhatIf = async (req: Request, res: Response): Promise<void> => {
  const resumeId = sendResumeError(res, req.params.resumeId);
  if (!resumeId) return;
  const rawSkills = typeof req.query.skills === "string" ? req.query.skills : "";
  const addedSkills = rawSkills.split(",").map((skill) => skill.trim()).filter(Boolean);
  if (!addedSkills.length || addedSkills.some((skill) => skill.length > 100)) {
    res.status(400).json({ success: false, message: "skills must contain one or more valid comma-separated skills" });
    return;
  }
  await handleContext(res, resumeId, ({ context, candidate, candidateEmbedding }) => {
    res.status(200).json({ success: true, data: simulateSkills(candidate, addedSkills, context.jobs, candidateEmbedding) });
  });
};