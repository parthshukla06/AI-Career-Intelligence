import { IResume } from "../models/Resume";
import { Job } from "../models/Job";
import { createCareerContext } from "./careerIntelligence.service";

export const getCareerContextForResume = async (resume: Pick<IResume, "candidateProfile" | "candidateEmbedding">) => {
  if (!resume.candidateProfile) return undefined;
  const jobs = await Job.find({ isActive: true }).select("+embedding").lean();
  return createCareerContext(resume.candidateProfile, jobs, resume.candidateEmbedding);
};
