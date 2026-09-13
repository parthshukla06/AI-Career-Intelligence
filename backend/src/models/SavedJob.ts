import mongoose, { Schema, type Model } from "mongoose";

export interface ISavedJob { userId: mongoose.Types.ObjectId; jobId: mongoose.Types.ObjectId; createdAt: Date; updatedAt: Date; }
const savedJobSchema = new Schema<ISavedJob>({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true } }, { timestamps: true });
savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });
const existingSavedJobModel = mongoose.models.SavedJob as Model<ISavedJob> | undefined;
export const SavedJob: Model<ISavedJob> = existingSavedJobModel || mongoose.model<ISavedJob>("SavedJob", savedJobSchema);
