import mongoose, { Schema, type Model } from "mongoose";
import { EXPERIENCE_LEVELS, WORK_MODES, type ExperienceLevel, type WorkMode } from "./Job";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  resumeId?: mongoose.Types.ObjectId;
  careerGoal?: string;
  targetRoles: string[];
  preferredIndustries: string[];
  preferredWorkModes: WorkMode[];
  preferredLocations: string[];
  experienceLevel?: ExperienceLevel;
  learningGoals: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  resumeId: { type: Schema.Types.ObjectId, ref: "Resume" },
  careerGoal: { type: String, trim: true, maxlength: 200 },
  targetRoles: { type: [String], default: [] },
  preferredIndustries: { type: [String], default: [] },
  preferredWorkModes: { type: [String], enum: WORK_MODES, default: [] },
  preferredLocations: { type: [String], default: [] },
  experienceLevel: { type: String, enum: EXPERIENCE_LEVELS },
  learningGoals: { type: [String], default: [] },
}, { timestamps: true });

const existingUserModel = mongoose.models.User as Model<IUser> | undefined;
export const User: Model<IUser> = existingUserModel || mongoose.model<IUser>("User", userSchema);
