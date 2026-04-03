// API Base URL — change to deployed URL in production
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Feature flags
export const FEATURES = {
  agent: true,
  explore: true,
  experiments: true,
  auth: true,
};

// Popular drug examples for quick-fill
export const EXAMPLE_SMILES = [
  { label: 'Aspirin', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O' },
  { label: 'Caffeine', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' },
  { label: 'Ibuprofen', smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O' },
  { label: 'Morphine', smiles: 'CN1CCC23C4C1CC5=C2C(=C(C=C5)OC3C(C=C4)O)O' },
  { label: 'Benzene', smiles: 'c1ccccc1' },
];
