export interface AssistantSource {
  title: string;
  category: string;
  source: string;
}

export interface AssistantContextUsed {
  candidateProfile: boolean;
  careerIntelligence: boolean;
  knowledgeBase: boolean;
  jobs: boolean;
}

export interface ChatResponse {
  success: boolean;
  data: {
    answer: string;
    sources: AssistantSource[];
    contextUsed: AssistantContextUsed;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
