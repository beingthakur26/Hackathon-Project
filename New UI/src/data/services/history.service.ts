import { apiClient } from '../api/client';
import type { ToxicityResult } from '../models/toxicity.model';

export interface HistoryEntry {
  id: string;
  smiles: string;
  prediction: number;
  toxicity_probability?: number;
  iupac_name?: string;
  molecular_formula?: string;
  features?: Record<string, number>;
  molecule_image?: string;
  created_at: string;
}

export interface HistoryListResponse {
  success: boolean;
  entries: HistoryEntry[];
  total: number;
  skip: number;
  limit: number;
}

export interface HistoryCreateData {
  smiles: string;
  prediction: number;
  toxicity_probability?: number;
  iupac_name?: string;
  molecular_formula?: string;
  features?: Record<string, number>;
  molecule_image?: string;
}

export const historyService = {
  async create(data: HistoryCreateData): Promise<{ success: boolean; message: string; id: string }> {
    const res = await apiClient.post('/history', data);
    return res.data;
  },

  async getList(skip: number = 0, limit: number = 50, search?: string): Promise<HistoryListResponse> {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (search) params.append('search', search);
    const res = await apiClient.get<HistoryListResponse>(`/history?${params}`);
    return res.data;
  },

  async getOne(id: string): Promise<{ success: boolean; entry: HistoryEntry }> {
    const res = await apiClient.get(`/history/${id}`);
    return res.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete(`/history/${id}`);
    return res.data;
  },

  async deleteAll(): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete('/history');
    return res.data;
  },

  // Helper to create history entry from toxicity result
  async createFromToxicityResult(result: ToxicityResult): Promise<{ success: boolean; message: string; id: string }> {
    return this.create({
      smiles: result.smiles,
      prediction: result.prediction ?? 0,
      toxicity_probability: result.toxicity_probability ?? undefined,
      iupac_name: result.iupac_name,
      molecular_formula: result.molecular_formula,
      features: { ...result.features },
      molecule_image: result.molecule_image ?? undefined,
    });
  },
};
