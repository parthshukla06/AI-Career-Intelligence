import { Request, Response } from "express";
import mongoose from "mongoose";
import { buildCareerPaths, buildResumeImprovementPrompt, buildRoadmap, generateAssistantAnswer, loadAssistantContext } from "../services/careerAssistant.service";
import { retrieveKnowledge } from "../services/rag.service";

const sourceSummary = (chunks: Awaited<ReturnType<typeof retrieveKnowledge>>) => chunks.map(({ title, category, source }) => ({ title, category, source }));

const validResumeId = (value: unknown): string | undefined => typeof value === "string" && mongoose.isValidObjectId(value) ? value : undefined;

const requireContext = async (res: Response, resumeIdValue: unknown) => {
  const resumeId = validResumeId(resumeIdValue);
  if (!resumeId) {
    res.status(400).json({ success: false, message: "Invalid resume id" });
    return undefined;
  }
  const context = await loadAssistantContext(resumeId);
  if (context === undefined) {
    res.status(404).json({ success: false, message: "Resume not found" });
    return undefined;
  }
  if (context === null) {
    res.status(422).json({ success: false, message: "Resume does not have an analyzed candidate profile" });
    return undefined;
  }
  return { resumeId, context };
};

export const chat = async (req: Request, res: Response): Promise<void> => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message || message.length > 4000) {
    res.status(400).json({ success: false, message: "message must be between 1 and 4000 characters" });
    return;
  }
  const resumeIdValue = req.body?.resumeId;
  if (resumeIdValue !== undefined && !validResumeId(resumeIdValue)) {
    res.status(400).json({ success: false, message: "Invalid resume id" });
    return;
  }

  try {
    let context;
    if (resumeIdValue) {
      const loaded = await requireContext(res, resumeIdValue);
      if (!loaded) return;
      context = loaded.context;
    }
    const knowledge = await retrieveKnowledge(message, 4);
    const answer = await generateAssistantAnswer(message, context, knowledge);
    res.status(200).json({ success: true, data: { answer, sources: sourceSummary(knowledge), contextUsed: { candidateProfile: Boolean(context?.candidate), careerIntelligence: Boolean(context?.readiness), knowledgeBase: knowledge.length > 0, jobs: Boolean(context?.jobs.length) } } });
  } catch (error) {
    console.error("Career assistant request failed", { errorType: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message.slice(0, 300) : "Unknown error" });
    res.status(502).json({ success: false, message: "Career assistant is temporarily unavailable" });
  }
};

export const roadmap = async (req: Request, res: Response): Promise<void> => {
  try {
    const loaded = await requireContext(res, req.params.resumeId);
    if (!loaded) return;
    const { context } = loaded;
    res.status(200).json({ success: true, data: { resumeId: loaded.resumeId, roadmap: buildRoadmap(context) } });
  } catch (error) {
    console.error("Career roadmap request failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    res.status(500).json({ success: false, message: "Unable to generate career roadmap" });
  }
};

export const resumeImprovement = async (req: Request, res: Response): Promise<void> => {
  try {
    const loaded = await requireContext(res, req.params.resumeId);
    if (!loaded) return;
    const knowledge = await retrieveKnowledge("resume improvement and project descriptions", 3);
    const answer = await generateAssistantAnswer(buildResumeImprovementPrompt(loaded.context), loaded.context, knowledge);
    res.status(200).json({ success: true, data: { resumeId: loaded.resumeId, answer, sources: sourceSummary(knowledge) } });
  } catch (error) {
    console.error("Resume improvement request failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    res.status(502).json({ success: false, message: "Resume improvement is temporarily unavailable" });
  }
};

export const careerPaths = async (req: Request, res: Response): Promise<void> => {
  try {
    const loaded = await requireContext(res, req.params.resumeId);
    if (!loaded) return;
    res.status(200).json({ success: true, data: { resumeId: loaded.resumeId, paths: buildCareerPaths(loaded.context) } });
  } catch (error) {
    console.error("Career paths request failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    res.status(500).json({ success: false, message: "Unable to generate career paths" });
  }
};
