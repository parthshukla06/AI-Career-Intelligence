import { Request, Response } from "express";
import { QueryFilter } from "mongoose";
import { IJob, Job } from "../models/Job";

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: QueryFilter<IJob> = { isActive: true };
    const title = asString(req.query.title);
    const industry = asString(req.query.industry);
    const experienceLevel = asString(req.query.experienceLevel);
    const workMode = asString(req.query.workMode);
    const location = asString(req.query.location);
    const skills = asString(req.query.skills);

    if (title) filters.title = { $regex: escapeRegex(title), $options: "i" };
    if (industry) filters.industry = { $regex: escapeRegex(industry), $options: "i" };
    if (experienceLevel) filters.experienceLevel = experienceLevel as IJob["experienceLevel"];
    if (workMode) filters.workMode = workMode as IJob["workMode"];
    if (location) filters.location = { $regex: escapeRegex(location), $options: "i" };
    if (skills) {
      const skillTerms = skills.split(",").map((skill) => skill.trim()).filter(Boolean);
      if (skillTerms.length) {
        const patterns = skillTerms.map((skill) => new RegExp(escapeRegex(skill), "i"));
        filters.$or = [
          { requiredSkills: { $in: patterns } },
          { preferredSkills: { $in: patterns } },
        ];
      }
    }

    const jobs = await Job.find(filters).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    res.status(500).json({ success: false, message: "Unable to fetch jobs" });
  }
};

export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || !Job.db.base.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid job id" });
      return;
    }

    const job = await Job.findOne({ _id: id, isActive: true });
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error("Failed to fetch job:", error);
    res.status(500).json({ success: false, message: "Unable to fetch job" });
  }
};
