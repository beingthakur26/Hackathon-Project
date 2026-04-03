import { create } from 'zustand';
import type { ToxicityResult } from '../../data/models/toxicity.model';
import { toxicityService } from '../../data/services/toxicity.service';
import { historyService } from '../../data/services/history.service';

interface ToxicityState {
  result: ToxicityResult | null;
  loading: boolean;
  error: string | null;
  predict: (smiles: string, saveToHistory?: boolean) => Promise<void>;
  clear: () => void;
}

export const useToxicityStore = create<ToxicityState>((set) => ({
  result: null,
  loading: false,
  error: null,

  predict: async (smiles: string, saveToHistory: boolean = true) => {
    set({ loading: true, error: null, result: null });
    try {
      const result = await toxicityService.predictFromSMILES(smiles);
      set({ result, loading: false });
      
      // Save to history if user is logged in
      if (saveToHistory && localStorage.getItem('toxinai_token')) {
        try {
          await historyService.createFromToxicityResult(result);
        } catch {
          // Silently fail - history save is optional
        }
      }
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clear: () => set({ result: null, error: null }),
}));
