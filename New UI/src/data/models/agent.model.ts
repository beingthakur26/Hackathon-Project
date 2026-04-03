// Agent Models

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentInput {
  message: string;
  history: AgentMessage[];
}

export interface AgentResponse {
  response: string;
}

export interface AgentGenerateInput {
  requirements: string;
}
