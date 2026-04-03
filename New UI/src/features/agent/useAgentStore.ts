import { create } from 'zustand';
import type { AgentMessage } from '../../data/models/agent.model';
import { agentService } from '../../data/services/agent.service';

interface AgentState {
  messages: AgentMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clear: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,

  sendMessage: async (text: string) => {
    const userMsg: AgentMessage = { role: 'user', content: text };
    set((s) => ({ messages: [...s.messages, userMsg], loading: true, error: null }));

    try {
      const history = get().messages;
      const res = await agentService.chat(text, history);
      const assistantMsg: AgentMessage = { role: 'assistant', content: res.response };
      set((s) => ({ messages: [...s.messages, assistantMsg], loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clear: () => set({ messages: [], error: null }),
}));
