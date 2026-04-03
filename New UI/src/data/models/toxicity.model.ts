// Toxicity Models

export interface SMILESInput {
  smiles: string;
}

export interface ToxicityFeatures {
  mol_weight: number;
  logP: number;
  hbd: number;
  hba: number;
  tpsa: number;
  qed: number;
  aromatic_rings: number;
  num_rotatable_bonds: number;
  num_heavy_atoms: number;
  num_rings: number;
  fraction_csp3: number;
  num_aliphatic_rings: number;
  num_saturated_rings: number;
  hallkier: number;
  labuteASA: number;
  balabanJ: number;
  chi0: number;
  chi1: number;
  kappa1: number;
  kappa2: number;
}

export interface ToxicityResult {
  smiles: string;
  canonical_smiles: string;
  iupac_name: string;
  molecular_formula: string;
  molecule_image: string | null;
  features: ToxicityFeatures;
  prediction: number | null;
  toxicity_probability: number | null;
  prediction_label: string;
}

export interface BatchPredictionResult {
  predictions: number[];
}
