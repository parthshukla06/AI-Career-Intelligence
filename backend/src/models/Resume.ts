import mongoose, { Schema, type Model } from "mongoose";
import { CandidateProfile } from "../types/candidateProfile";

export type ResumeProcessingStatus = "completed" | "failed";
export type AIAnalysisStatus = "pending" | "completed" | "failed";

export interface IResume {
  originalFilename: string;
  userId: mongoose.Types.ObjectId;
  extractedText: string;
  candidateProfile?: CandidateProfile;
  uploadedAt: Date;
  processingStatus: ResumeProcessingStatus;
  processingError?: string;
  aiAnalysisStatus: AIAnalysisStatus;
  aiModel?: string;
  candidateEmbedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const experienceSchema = new Schema(
  {
    company: { type: String, default: null },
    role: { type: String, default: null },
    duration: { type: String, default: null },
    description: String,
    skills: { type: [String], default: [] },
  },
  { _id: false },
);
const educationSchema = new Schema(
  {
    institution: { type: String, default: null },
    degree: { type: String, default: null },
    field: { type: String, default: null },
    year: { type: String, default: null },
  },
  { _id: false },
);
const projectSchema = new Schema(
  {
    name: { type: String, default: null },
    description: String,
    technologies: { type: [String], default: [] },
  },
  { _id: false },
);
const candidateProfileSchema = new Schema(
  {
    name: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    location: { type: String, default: null },
    summary: { type: String, default: null },
    skills: { type: [String], default: [] },
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certifications: { type: [String], default: [] },
    totalExperience: { type: Number, default: 0 },
    targetRoles: { type: [String], default: [] },
  },
  { _id: false },
);

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFilename: { type: String, required: true, trim: true },
    extractedText: { type: String, required: true },
    candidateProfile: { type: candidateProfileSchema },
    uploadedAt: { type: Date, default: Date.now },
    processingStatus: {
      type: String,
      enum: ["completed", "failed"],
      required: true,
    },
    processingError: { type: String, trim: true },
    aiAnalysisStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      required: true,
      default: "pending",
    },
    aiModel: { type: String, trim: true },
    candidateEmbedding: { type: [Number], default: undefined, select: false },
  },
  { timestamps: true },
);

const existingResumeModel = mongoose.models.Resume as
  | Model<IResume>
  | undefined;

export const Resume: Model<IResume> =
  existingResumeModel || mongoose.model<IResume>("Resume", resumeSchema);
