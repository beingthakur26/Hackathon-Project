// Molecule & Explore Models

export interface MoleculeInfo {
  smiles: string;
  iupac_name?: string;
  molecular_formula?: string;
  canonical_smiles?: string;
  molecule_image?: string | null;
}

export interface DrugEntry {
  name: string;
  smiles: string;
  category: string;
  description: string;
  molecular_formula?: string;
}

export interface ExploreSearchResult {
  results: DrugEntry[];
}

export interface DrugDetail extends DrugEntry {
  iupac_name: string;
  features: Record<string, number>;
  molecule_image: string | null;
}

export interface DrugCategory {
  icon: string;
  color: string;
  description: string;
}
