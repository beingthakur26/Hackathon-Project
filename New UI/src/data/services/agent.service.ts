import { apiClient } from '../api/client';
import type { AgentInput, AgentResponse } from '../models/agent.model';

export const agentService = {
  async chat(message: string, history: AgentInput['history'] = []): Promise<AgentResponse> {
    const payload: AgentInput = { message, history };
    const res = await apiClient.post<AgentResponse>('/agent/chat', payload);
    return res.data;
  },

  async generateCompound(requirements: string): Promise<AgentResponse> {
    const res = await apiClient.post<AgentResponse>('/agent/generate', { requirements });
    return res.data;
  },
};
