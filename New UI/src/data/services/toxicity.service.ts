import { apiClient } from '../api/client';
import type { SMILESInput, ToxicityResult } from '../models/toxicity.model';

export const toxicityService = {
  async predictFromSMILES(smiles: string): Promise<ToxicityResult> {
    const input: SMILESInput = { smiles };
    const res = await apiClient.post<ToxicityResult>('/predict-smiles/', input);
    return res.data;
  },

  async predictBatch(file: File): Promise<{ predictions: number[] }> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post('/predict-batch/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async searchCompound(query: string) {
    const res = await apiClient.get(`/search/${encodeURIComponent(query)}`);
    return res.data;
  },
};
