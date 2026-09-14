import OpenAI from "openai";
import { IJob, Job } from "../models/Job";
import { Resume } from "../models/Resume";
import { CandidateProfile } from "../types/candidateProfile";
import {
  createCareerContext,
  analyzeSkillGaps,
  calculateReadiness,
  explainRecommendation,
  SkillGap,
} from "./careerIntelligence.service";
import { JobRecommendation } from "./jobMatching.service";
import { createGroqClient } from "./groqResumeAnalyzer.service";
import {
  retrieveKnowledge,
  KnowledgeChunkResult,
} from "./rag.service";
import {
  createCareerRoadmap,
  CareerRoadmap,
} from "./roadmap.service";

const ASSISTANT_SYSTEM_INSTRUCTIONS = `You are an AI Career Assistant.
Give practical and honest career guidance. Use provided candidate context when available. Never invent candidate information or job requirements. If job requirements are provided, use those exact requirements. Treat retrieved knowledge as supporting context. Clearly say when information is unavailable. Do not change deterministic recommendation scores. Do not claim a skill is required unless the provided job data or knowledge context supports it. Prefer actionable next steps. For beginners, explain concepts simply. Do not overwhelm the user with unnecessary technologies.`;

export interface AssistantContext {
  candidate?: CandidateProfile;
  recommendations: JobRecommendation[];
  skillGaps: SkillGap[];
  readiness?: ReturnType<typeof calculateReadiness>;
  jobs: IJob[];
}

export interface AssistantSource {
  title: string;
  category: string;
  source: string;
}

export const loadAssistantContext = async (
  resumeId: string,
): Promise<AssistantContext | null | undefined> => {
  const resume = await Resume.findById(resumeId).select(
    "candidateProfile +candidateEmbedding",
  );

  if (!resume) return undefined;

  if (!resume.candidateProfile) return null;

  const jobs = await Job.find({ isActive: true })
    .select("+embedding")
    .lean();

  const context = createCareerContext(
    resume.candidateProfile,
    jobs,
    resume.candidateEmbedding,
  );

  const skillGaps = analyzeSkillGaps(
    resume.candidateProfile,
    context.jobs,
  ).gaps;

  return {
    candidate: resume.candidateProfile,
    recommendations: context.recommendations,
    skillGaps,
    readiness: calculateReadiness(
      resume.candidateProfile,
      context.recommendations,
    ),
    jobs,
  };
};

/**
 * Keep the candidate context small enough for Groq's TPM limit.
 * The previous 30,000-character limit could make the combined
 * candidate + knowledge prompt exceed the 8,000 TPM limit.
 */
const compactContext = (
  context: AssistantContext | undefined,
): string => {
  if (!context?.candidate) {
    return "No candidate profile was provided.";
  }

  return JSON.stringify({
    candidateProfile: context.candidate,
    careerIntelligence: {
      readiness: context.readiness,
      skillGaps: context.skillGaps.slice(0, 10),
    },
    recommendedJobs: context.recommendations
      .slice(0, 5)
      .map((recommendation) =>
        explainRecommendation(recommendation),
      ),
  }).slice(0, 18000);
};

export const generateAssistantAnswer = async (
  message: string,
  context: AssistantContext | undefined,
  knowledge: KnowledgeChunkResult[],
  clientOverride?: OpenAI,
): Promise<string> => {
  const client = clientOverride || createGroqClient();
  const model =
    process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  /**
   * Keep retrieved knowledge compact so the total request
   * remains safely below Groq's 8,000 TPM limit.
   */
  const knowledgeContext = knowledge
    .map(
      (chunk) =>
        `[${chunk.title}] ${chunk.content}`,
    )
    .join("\n\n")
    .slice(0, 6000);

  const dataContext = compactContext(context);

  const userContent = `User question:
${message}

Candidate and job data (authoritative):
${dataContext}

Retrieved internal knowledge (supporting context):
${knowledgeContext || "No relevant knowledge was retrieved."}`;

  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content: ASSISTANT_SYSTEM_INSTRUCTIONS,
      },
      {
        role: "user",
        content: userContent,
      },
    ],
  });

  const answer =
    response.choices[0]?.message.content?.trim();

  if (!answer) {
    throw new Error("Groq returned an empty answer");
  }

  return answer;
};

export const buildRoadmap = (
  context: AssistantContext,
): CareerRoadmap => {
  if (!context.candidate || !context.readiness) {
    throw new Error(
      "Candidate context is unavailable",
    );
  }

  return createCareerRoadmap(
    context.candidate,
    context.readiness,
    context.skillGaps,
    context.recommendations,
  );
};

export const buildCareerPaths = (
  context: AssistantContext,
) => {
  const candidate = context.candidate;

  if (!candidate) return [];

  const paths = [
    {
      title: "Backend Engineering",
      terms: [
        "backend",
        "node",
        "api",
        "server",
        "database",
        "java",
      ],
      nextSkills: [
        "Testing",
        "Docker",
        "System Design",
      ],
    },
    {
      title: "Software Engineering",
      terms: [
        "software",
        "programming",
        "java",
        "javascript",
        "git",
      ],
      nextSkills: [
        "Data structures",
        "Testing",
        "System Design",
      ],
    },
    {
      title: "Data Analytics",
      terms: [
        "data",
        "sql",
        "analytics",
        "statistics",
        "python",
      ],
      nextSkills: [
        "SQL",
        "Statistics",
        "Data Visualization",
      ],
    },
    {
      title: "ML/AI Engineering",
      terms: [
        "machine",
        "learning",
        "python",
        "ai",
        "model",
      ],
      nextSkills: [
        "Model evaluation",
        "Deployment",
        "Data pipelines",
      ],
    },
  ];

  const profileText = `${candidate.skills.join(
    " ",
  )} ${candidate.summary || ""} ${candidate.targetRoles.join(
    " ",
  )}`.toLowerCase();

  return paths
    .map((path) => {
      const matched = path.terms.filter((term) =>
        profileText.includes(term),
      ).length;

      const relatedJobs =
        context.recommendations.filter((recommendation) =>
          path.terms.some((term) =>
            recommendation.title
              .toLowerCase()
              .includes(term),
          ),
        ).length;

      return {
        title: path.title,
        support: matched + relatedJobs,
        whyItFits: matched
          ? `Supported by ${matched} profile signal(s) and ${relatedJobs} related recommendation(s).`
          : `Supported by ${relatedJobs} related recommendation(s).`,
        strengths: candidate.skills
          .filter((skill) =>
            path.terms.some((term) =>
              skill.toLowerCase().includes(term),
            ),
          )
          .slice(0, 6),
        mainGaps: context.skillGaps
          .filter((gap) =>
            path.nextSkills.some(
              (skill) =>
                skill.toLowerCase() ===
                gap.skill.toLowerCase(),
            ),
          )
          .slice(0, 4)
          .map((gap) => gap.skill),
        recommendedNextSkills: path.nextSkills,
      };
    })
    .filter((path) => path.support > 0)
    .sort(
      (left, right) =>
        right.support - left.support,
    )
    .map(
      ({
        support: _support,
        ...path
      }) => path,
    );
};

export const buildResumeImprovementPrompt = (
  context: AssistantContext,
): string =>
  `Review this structured candidate profile for truthful resume improvements. Do not invent achievements, metrics, employers, skills, or experience.

Return concise sections titled:
Strengths
Missing information
Unclear areas
Improvement suggestions
Project-description suggestions
Skills presentation suggestions

Focus on actionable improvements supported by the candidate data.

${compactContext(context)}`;