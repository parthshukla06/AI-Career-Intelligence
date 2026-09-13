import { Request, Response } from "express";
import mongoose from "mongoose";
import { Job } from "../models/Job";
import { Resume } from "../models/Resume";
import { rankJobs } from "../services/jobMatching.service";

const parseLimit = (value: unknown): number | undefined => {
  if (value === undefined) return 10;
  if (typeof value !== "string" || !/^\d+$/.test(value) || Number(value) < 1) return undefined;
  return Math.min(Number(value), 20);
};

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  const { resumeId } = req.params;
  if (!resumeId || !mongoose.isValidObjectId(resumeId)) {
    res.status(400).json({ success: false, message: "Invalid resume id" });
    return;
  }

  const limit = parseLimit(req.query.limit);
  if (!limit) {
    res.status(400).json({ success: false, message: "limit must be a positive integer" });
    return;
  }

  try {
    const resume = await Resume.findById(resumeId).select("candidateProfile +candidateEmbedding");
    if (!resume) {
      res.status(404).json({ success: false, message: "Resume not found" });
      return;
    }
    if (!resume.candidateProfile) {
      res.status(422).json({ success: false, message: "Resume does not have an analyzed candidate profile" });
      return;
    }

    const jobs = await Job.find({ isActive: true }).select("+embedding").lean();
    const recommendations = rankJobs(resume.candidateProfile, jobs, resume.candidateEmbedding).slice(0, limit);
    res.status(200).json({ success: true, data: { resumeId, recommendations } });
  } catch (error) {
    console.error("Failed to generate job recommendations:", error);
    res.status(500).json({ success: false, message: "Unable to generate job recommendations" });
  }
};