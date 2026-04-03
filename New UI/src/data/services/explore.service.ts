import { apiClient } from '../api/client';
import type { DrugEntry, DrugDetail } from '../models/molecule.model';

export const exploreService = {
  async search(query: string): Promise<{ results: DrugEntry[] }> {
    const res = await apiClient.get(`/explore/search/${encodeURIComponent(query)}`);
    return res.data;
  },

  async getDrug(name: string): Promise<DrugDetail> {
    const res = await apiClient.get(`/explore/drug/${encodeURIComponent(name)}`);
    return res.data;
  },

  async getCategories(): Promise<{ categories: Record<string, { icon: string; color: string; description: string }> }> {
    const res = await apiClient.get('/explore/categories');
    return res.data;
  },

  async get3DMolecule(smiles: string) {
    const res = await apiClient.get(`/molecule/3d/${encodeURIComponent(smiles)}`);
    return res.data;
  },
};
