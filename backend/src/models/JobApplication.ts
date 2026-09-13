import mongoose, { Schema, type Model } from "mongoose";

export const APPLICATION_STATUSES = ["interested", "applied", "interview", "rejected", "offer"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export interface IJobApplication { userId: mongoose.Types.ObjectId; jobId: mongoose.Types.ObjectId; status: ApplicationStatus; createdAt: Date; updatedAt: Date; }
const applicationSchema = new Schema<IJobApplication>({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true }, status: { type: String, enum: APPLICATION_STATUSES, required: true } }, { timestamps: true });
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
const existingApplicationModel = mongoose.models.JobApplication as Model<IJobApplication> | undefined;
export const JobApplication: Model<IJobApplication> = existingApplicationModel || mongoose.model<IJobApplication>("JobApplication", applicationSchema);
