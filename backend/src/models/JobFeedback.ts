import mongoose, { Schema, type Model } from "mongoose";

export const JOB_FEEDBACK_VALUES = ["interested", "not_interested"] as const;
export type JobFeedbackValue = (typeof JOB_FEEDBACK_VALUES)[number];
export interface IJobFeedback { userId: mongoose.Types.ObjectId; jobId: mongoose.Types.ObjectId; feedback: JobFeedbackValue; createdAt: Date; updatedAt: Date; }
const feedbackSchema = new Schema<IJobFeedback>({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true }, feedback: { type: String, enum: JOB_FEEDBACK_VALUES, required: true } }, { timestamps: true });
feedbackSchema.index({ userId: 1, jobId: 1 }, { unique: true });
const existingFeedbackModel = mongoose.models.JobFeedback as Model<IJobFeedback> | undefined;
export const JobFeedback: Model<IJobFeedback> = existingFeedbackModel || mongoose.model<IJobFeedback>("JobFeedback", feedbackSchema);
