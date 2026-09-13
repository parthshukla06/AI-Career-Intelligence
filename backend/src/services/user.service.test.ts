import assert from "node:assert/strict";
import { calculatePersonalizationBoost } from "./user.service";

const user = { careerGoal: "Backend Developer", targetRoles: ["Backend Engineer"], preferredIndustries: ["Software"], preferredWorkModes: ["remote"] as ("remote" | "hybrid" | "onsite")[] };
const job = { title: "Backend Engineer", industry: "Software", workMode: "remote" as const };

const positive = calculatePersonalizationBoost(user, job, { saved: true, feedback: "interested", applied: false });
assert.equal(positive.boost, 10);
assert.ok(positive.reasons.includes("Matches your preferred role"));

const bounded = calculatePersonalizationBoost(user, job, { saved: true, feedback: "interested", applied: true });
assert.equal(bounded.boost, 10);

const negative = calculatePersonalizationBoost(user, { title: "Data Analyst", industry: "Finance", workMode: "onsite" }, { saved: false, feedback: "not_interested", applied: true });
assert.equal(negative.boost, -10);
assert.ok(negative.boost >= -10 && negative.boost <= 10);
console.log("user.service tests passed");
