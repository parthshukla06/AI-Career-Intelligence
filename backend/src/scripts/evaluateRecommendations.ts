import fs from "fs";
import path from "path";
import { CandidateProfile } from "../types/candidateProfile";
import { MatchableJob, rankJobs } from "../services/jobMatching.service";

type EvaluationScenario = { name: string; candidate: CandidateProfile; expectedRelevantJobs: string[]; expectedOrdering?: string[] };

type MetricResult = { precision: number; recall: number; hitRate: number; mrr: number };

const scenariosPath = path.resolve(__dirname, "../../data/evaluation/recommendation-scenarios.json");
const jobsPath = path.resolve(__dirname, "../data/jobs.json");
const round = (value: number): number => Math.round(value * 1000) / 1000;

const evaluateAtK = (scenario: EvaluationScenario, predictions: string[], k: number): MetricResult => {
  const expected = new Set(scenario.expectedRelevantJobs);
  const top = predictions.slice(0, k);
  const hits = top.filter((title) => expected.has(title)).length;
  const firstRelevantIndex = predictions.findIndex((title) => expected.has(title));
  return {
    precision: round(hits / k),
    recall: round(expected.size ? hits / expected.size : 0),
    hitRate: hits > 0 ? 1 : 0,
    mrr: firstRelevantIndex >= 0 ? round(1 / (firstRelevantIndex + 1)) : 0,
  };
};

const evaluateRecommendations = (): void => {
  const scenarios = JSON.parse(fs.readFileSync(scenariosPath, "utf8")) as EvaluationScenario[];
  const jobs = JSON.parse(fs.readFileSync(jobsPath, "utf8")) as MatchableJob[];
  const ks = [3, 5, 10];
  scenarios.forEach((scenario) => {
    const predictions = rankJobs(scenario.candidate, jobs).map((recommendation) => recommendation.title);
    console.log(`Scenario: ${scenario.name}`);
    console.log(`Predicted top 3: ${predictions.slice(0, 3).join(" | ")}`);
    ks.forEach((k) => console.log(`K=${k}`, evaluateAtK(scenario, predictions, k)));
  });
  console.log("Recommendation evaluation complete. Metrics are measurements on curated scenarios, not production accuracy claims.");
};

try {
  evaluateRecommendations();
} catch (error) {
  console.error("Recommendation evaluation failed", { errorType: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "Unknown error" });
  process.exitCode = 1;
}
