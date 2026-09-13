import assert from "node:assert/strict";
import { MatchableJob, calculateExperienceMatch, matchJob, normalizeSkill, rankJobs } from "./jobMatching.service";
import { CandidateProfile } from "../types/candidateProfile";

const candidate = (overrides: Partial<CandidateProfile> = {}): CandidateProfile => ({
  name: null, email: null, phone: null, location: null, summary: null,
  skills: [], experience: [], education: [], projects: [], certifications: [], totalExperience: 0, targetRoles: [],
  ...overrides,
});

const job = (overrides: Partial<MatchableJob> = {}): MatchableJob => ({
  _id: "job-1", title: "Backend Engineer", company: "Example Co", industry: "Technology",
  location: "Remote", workMode: "remote", employmentType: "full-time", experienceLevel: "entry",
  minExperience: 0, maxExperience: 2, salaryMin: 0, salaryMax: 0, currency: "USD",
  requiredSkills: ["JavaScript", "Node.js", "MongoDB"], preferredSkills: ["REST APIs"],
  responsibilities: [], qualifications: [], education: "None", jobDescription: "",
  source: "Test", sourceUrl: "https://example.com/job-1", isActive: true,
  createdAt: new Date(), updatedAt: new Date(), ...overrides,
});

assert.equal(normalizeSkill("javascript"), "JavaScript");
assert.equal(normalizeSkill("nodejs"), "Node.js");
assert.equal(normalizeSkill("react"), "React.js");

const strongMatch = matchJob(candidate({ skills: ["JavaScript", "node", "NODE.JS", "MongoDB"], targetRoles: ["Backend Engineer"] }), job());
assert.deepEqual(strongMatch.matchedSkills, ["JavaScript", "Node.js", "MongoDB"]);
assert.deepEqual(strongMatch.missingRequiredSkills, []);
assert.equal(strongMatch.matchScore, 75);

const partialMatch = matchJob(candidate({ skills: ["JavaScript"] }), job());
assert.equal(partialMatch.matchedSkills.length, 1);
assert.equal(partialMatch.missingRequiredSkills.length, 2);
assert.ok(partialMatch.matchScore >= 0 && partialMatch.matchScore <= 100);

assert.equal(calculateExperienceMatch(0, job({ experienceLevel: "entry", minExperience: 0, maxExperience: 2 })), 100);
assert.ok(calculateExperienceMatch(0, job({ experienceLevel: "senior", minExperience: 5, maxExperience: 8 })) < 50);

const noSkillsMatch = matchJob(candidate(), job());
assert.equal(noSkillsMatch.matchedSkills.length, 0);
assert.equal(noSkillsMatch.missingRequiredSkills.length, 3);
assert.equal(matchJob(candidate({ targetRoles: [] }), job()).roleMatch, 50);

const sorted = rankJobs(candidate({ skills: ["JavaScript", "Node.js", "MongoDB"] }), [
  job({ _id: "low", requiredSkills: ["Python", "Docker"], title: "Data Engineer", experienceLevel: "mid", minExperience: 3, maxExperience: 5 }),
  job({ _id: "high", title: "Backend Engineer" }),
]);
assert.equal(sorted[0]?.jobId, "high");
assert.ok(sorted.every((recommendation) => recommendation.matchScore >= 0 && recommendation.matchScore <= 100));
assert.ok(sorted[0]!.matchScore >= sorted[1]!.matchScore);

console.log("jobMatching.service tests passed");