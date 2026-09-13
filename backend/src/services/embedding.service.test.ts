import assert from "node:assert/strict";
import { generateCandidateEmbedding, generateJobEmbedding } from "./embedding.service";
import { candidateEmbeddingText, jobEmbeddingText } from "./embeddingText.service";
import { cosineSimilarity, similarityScore } from "../utils/vector.util";
import { CandidateProfile } from "../types/candidateProfile";

const candidate: CandidateProfile = {
  name: "Private Name", email: "private@example.com", phone: "000", location: "Private Location",
  summary: "Backend engineer focused on APIs", skills: ["Node.js", "MongoDB"], experience: [], education: [],
  projects: [], certifications: [], totalExperience: 1, targetRoles: ["Backend Engineer"],
};
const job = {
  title: "Backend Engineer", industry: "Technology", experienceLevel: "entry" as const,
  requiredSkills: ["Node.js"], preferredSkills: ["MongoDB"], responsibilities: ["Build APIs"],
  qualifications: ["Programming fundamentals"], jobDescription: "Build backend services",
};

assert.ok(!candidateEmbeddingText(candidate).includes("private@example.com"));
assert.ok(!candidateEmbeddingText(candidate).includes("000"));
assert.ok(jobEmbeddingText(job).includes("Backend Engineer"));
assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
assert.equal(cosineSimilarity([1], [1, 0]), null);
assert.equal(cosineSimilarity([], [1]), null);
assert.equal(similarityScore(undefined, [1]), 0);

const run = async (): Promise<void> => {
  const candidateEmbedding = await generateCandidateEmbedding(candidate);
  const jobEmbedding = await generateJobEmbedding(job);
  assert.equal(candidateEmbedding.length, 384);
  assert.equal(jobEmbedding.length, 384);
  assert.ok(similarityScore(candidateEmbedding, jobEmbedding) >= 0);
  console.log("embedding.service tests passed");
};

run().catch((error: unknown) => {
  console.error("embedding.service tests failed", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});