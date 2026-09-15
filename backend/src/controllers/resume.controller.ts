import { Request, Response } from "express";
import mongoose from "mongoose";
import { Resume } from "../models/Resume";
import { extractTextFromPdf } from "../services/resumeParser.service";
import {
  analyzeResume,
  getResumeAnalysisModel,
  ResumeAnalysisError,
} from "../services/resumeAnalyzer.service";
import { generateCandidateEmbedding } from "../services/embedding.service";

export const uploadResume = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "A PDF file is required in the resume field",
    });
    return;
  }

  const userId = new mongoose.Types.ObjectId(req.userId);

  let extractedText: string;

  try {
    extractedText = await extractTextFromPdf(req.file.buffer);
    console.log("Resume text extracted successfully");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to process the uploaded resume";

    console.error("Resume text extraction failed:", error);

    res.status(422).json({
      success: false,
      message,
    });
    return;
  }

  let candidateProfile;

  try {
    candidateProfile = await analyzeResume(extractedText);
  } catch (error) {
    if (!(error instanceof ResumeAnalysisError)) {
      res.status(502).json({
        success: false,
        message:
          "Resume analysis could not be completed. Please try again later.",
      });
      return;
    }

    try {
      await Resume.create({
        userId,
        originalFilename: req.file.originalname,
        extractedText,
        processingStatus: "failed",
        processingError: error.kind,
        aiAnalysisStatus: "failed",
        aiModel: getResumeAnalysisModel(),
      });
    } catch (saveError) {
      console.error(
        "Failed to save resume analysis failure:",
        saveError,
      );

      res.status(500).json({
        success: false,
        message: "Unable to save resume processing status",
      });
      return;
    }

    const status = error.kind === "configuration" ? 503 : 502;

    const message =
      error.kind === "configuration"
        ? "AI resume analysis is unavailable because GROQ_API_KEY is not configured"
        : "Resume analysis could not be completed. Please try again later.";

    res.status(status).json({
      success: false,
      message,
    });
    return;
  }

  let candidateEmbedding: number[] | undefined;

  try {
    candidateEmbedding =
      await generateCandidateEmbedding(candidateProfile);
  } catch (error) {
    console.error(
      "Candidate embedding generation failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  try {
    const resume = await Resume.create({
      userId,
      originalFilename: req.file.originalname,
      extractedText,
      candidateProfile,
      ...(candidateEmbedding ? { candidateEmbedding } : {}),
      processingStatus: "completed",
      aiAnalysisStatus: "completed",
      aiModel: getResumeAnalysisModel(),
    });

    res.status(201).json({
      success: true,
      message: "Resume uploaded and analyzed successfully",
      data: {
        id: resume._id,
        originalFilename: resume.originalFilename,
        candidateProfile: resume.candidateProfile,
      },
    });
  } catch (error) {
    console.error("Failed to save analyzed resume:", error);

    res.status(500).json({
      success: false,
      message: "Unable to save analyzed resume",
    });
  }
};

export const getMyResume = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    const resume = await Resume.findOne({
      userId: new mongoose.Types.ObjectId(req.userId),
      processingStatus: "completed",
    })
      .sort({ createdAt: -1 })
      .select("-extractedText");

    if (!resume) {
      res.status(404).json({
        success: false,
        message: "No resume found for this account",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    console.error("Failed to fetch user's resume:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch resume",
    });
  }
};

export const getResumeById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  if (!req.userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (!id || !mongoose.isValidObjectId(id)) {
    res.status(400).json({
      success: false,
      message: "Invalid resume id",
    });
    return;
  }

  try {
    const resume = await Resume.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(req.userId),
    }).select("-extractedText");

    if (!resume) {
      res.status(404).json({
        success: false,
        message: "Resume not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    console.error("Failed to fetch resume:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch resume",
    });
  }
};