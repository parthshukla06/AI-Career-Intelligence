import assert from "node:assert/strict";
import { CandidateProfile } from "../types/candidateProfile";
import { MatchableJob, matchJob } from "./jobMatching.service";
import { analyzeSkillDemand, analyzeSkillGaps, calculateReadiness, categorizeExperienceRecommendations, explainRecommendation, simulateSkills } from "./careerIntelligence.service";

const candidate: CandidateProfile = {
  name: null, email: null, phone: null, location: null, summary: "Backend engineer",
  skills: ["JavaScript", "nodejs"], experience: [], education: [], projects: [{ name: "API", description: "Backend API", technologies: ["MongoDB"] }], certifications: [], totalExperience: 0, targetRoles: ["Backend Engineer"],
};
const job = (overrides: Partial<MatchableJob> = {}): MatchableJob => ({
  _id: "job-1", title: "Backend Engineer", company: "Example", industry: "Software", location: "Remote", workMode: "remote", employmentType: "full-time", experienceLevel: "entry", minExperience: 0, maxExperience: 2, salaryMin: 0, salaryMax: 0, currency: "USD", requiredSkills: ["JavaScript", "Node.js", "TypeScript"], preferredSkills: ["Docker"], responsibilities: [], qualifications: [], education: "", jobDescription: "", source: "test", sourceUrl: "https://example.com/1", isActive: true, embedding: [1, 0], createdAt: new Date(), updatedAt: new Date(), ...overrides,
});

const recommendation = matchJob(candidate, job(), [1, 0]);
const explanation = explainRecommendation(recommendation);
assert.equal(explanation.overallScore, recommendation.matchScore);
assert.ok(explanation.missingRequiredSkills.includes("TypeScript"));
assert.ok(explanation.explanation.keySkillGaps.includes("TypeScript"));
assert.equal(explanation.whyNot, undefined);

const weak = explainRecommendation(matchJob({ ...candidate, skills: [], projects: [], targetRoles: [], summary: null }, job({ experienceLevel: "senior", minExperience: 5, maxExperience: 8 }), [0, 1]));
assert.ok(weak.whyNot);
assert.ok(weak.whyNot!.reasons.length > 0);

const gaps = analyzeSkillGaps(candidate, [job(), job({ _id: "job-2", requiredSkills: ["TypeScript"], preferredSkills: [] })]);
assert.equal(gaps.gaps.find((gap) => gap.skill === "TypeScript")?.priority, "HIGH");
assert.ok(gaps.candidateSkills.includes("Node.js"));

const demand = analyzeSkillDemand([job(), job({ _id: "job-2", requiredSkills: ["TypeScript"], preferredSkills: ["JavaScript"] })]);
assert.equal(demand.find((item) => item.skill === "TypeScript")?.requiredCount, 2);
assert.equal(demand.find((item) => item.skill === "JavaScript")?.preferredCount, 1);

const recommendations = [recommendation, matchJob(candidate, job({ _id: "job-2", experienceLevel: "senior", minExperience: 5, maxExperience: 8 }), [1, 0])];
const categories = categorizeExperienceRecommendations(recommendations);
assert.equal(categories.strongFit.length, 1);
assert.equal(categories.stretchRole.length, 1);
assert.ok(calculateReadiness(candidate, recommendations).score >= 0 && calculateReadiness(candidate, recommendations).score <= 100);

const whatIf = simulateSkills(candidate, ["TypeScript"], [job()], [1, 0]);
assert.ok(whatIf.after[0]!.matchScore >= whatIf.before[0]!.matchScore);
assert.equal(whatIf.addedSkills[0], "TypeScript");
console.log("careerIntelligence.service tests passed");