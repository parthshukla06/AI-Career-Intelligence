import assert from "node:assert/strict";
import OpenAI from "openai";
import { CandidateProfile } from "../types/candidateProfile";
import { buildCareerPaths, buildResumeImprovementPrompt, buildRoadmap, generateAssistantAnswer } from "./careerAssistant.service";
import { createCareerContext, analyzeSkillGaps, calculateReadiness } from "./careerIntelligence.service";
import { MatchableJob } from "./jobMatching.service";

const candidate: CandidateProfile = {
  name: null, email: null, phone: null, location: null, summary: "Backend developer building APIs",
  skills: ["JavaScript", "Node.js"], experience: [], education: [], projects: [{ name: "API", description: "Backend service", technologies: ["MongoDB"] }], certifications: [], totalExperience: 0, targetRoles: ["Backend Engineer"],
};
const job: MatchableJob = {
  _id: "job-1", title: "Backend Engineer", company: "Example", industry: "Software", location: "Remote", workMode: "remote", employmentType: "full-time", experienceLevel: "entry", minExperience: 0, maxExperience: 2, salaryMin: 0, salaryMax: 0, currency: "USD", requiredSkills: ["JavaScript", "Node.js", "TypeScript"], preferredSkills: ["Docker"], responsibilities: ["Build APIs"], qualifications: [], education: "", jobDescription: "Build services", source: "test", sourceUrl: "https://example.com/assistant", isActive: true, embedding: [1, 0], createdAt: new Date(), updatedAt: new Date(),
};
const context = createCareerContext(candidate, [job], [1, 0]);
const assistantContext = { candidate, recommendations: context.recommendations, skillGaps: analyzeSkillGaps(candidate, [job]).gaps, readiness: calculateReadiness(candidate, context.recommendations), jobs: [job] };

const mockClient = {
  chat: { completions: { create: async () => ({ choices: [{ message: { content: "Focus on TypeScript next." } }] }) } },
} as unknown as OpenAI;

const run = async (): Promise<void> => {
  const withoutResume = await generateAssistantAnswer("What should I learn next?", undefined, [], mockClient);
  const withResume = await generateAssistantAnswer("What should I learn next?", assistantContext, [], mockClient);
  assert.equal(withoutResume, "Focus on TypeScript next.");
  assert.equal(withResume, "Focus on TypeScript next.");
  assert.ok(buildResumeImprovementPrompt(assistantContext).includes("structured candidate profile"));
  assert.equal(buildRoadmap(assistantContext).targetRole, "Backend Engineer");
  assert.ok(buildCareerPaths(assistantContext).some((path) => path.title === "Backend Engineering"));

  const failingClient = { chat: { completions: { create: async () => { throw new Error("provider unavailable"); } } } } as unknown as OpenAI;
  await assert.rejects(() => generateAssistantAnswer("Help", undefined, [], failingClient), /provider unavailable/);
  console.log("careerAssistant.service tests passed");
};

run().catch((error: unknown) => {
  console.error("careerAssistant.service tests failed", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
