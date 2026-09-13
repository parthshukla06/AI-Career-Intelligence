import mongoose, { Schema, type Model } from "mongoose";

export const LEARNING_STATUSES = ["planned", "learning", "completed"] as const;
export type LearningStatus = (typeof LEARNING_STATUSES)[number];
export interface ILearningProgress { userId: mongoose.Types.ObjectId; skill: string; normalizedSkill: string; status: LearningStatus; progress: number; createdAt: Date; updatedAt: Date; }
const learningProgressSchema = new Schema<ILearningProgress>({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, skill: { type: String, required: true, trim: true }, normalizedSkill: { type: String, required: true, trim: true }, status: { type: String, enum: LEARNING_STATUSES, required: true }, progress: { type: Number, min: 0, max: 100, required: true } }, { timestamps: true });
learningProgressSchema.index({ userId: 1, normalizedSkill: 1 }, { unique: true });
const existingLearningProgressModel = mongoose.models.LearningProgress as Model<ILearningProgress> | undefined;
export const LearningProgress: Model<ILearningProgress> = existingLearningProgressModel || mongoose.model<ILearningProgress>("LearningProgress", learningProgressSchema);
