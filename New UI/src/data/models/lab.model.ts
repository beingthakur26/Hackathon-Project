export interface Atom {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
  charge: number;
}

export interface Bond {
  id: string;
  from: string; // Atom ID
  to: string;   // Atom ID
  type: 1 | 2 | 3; // Single, Double, Triple
}

export interface MolecularGraph {
  atoms: Atom[];
  bonds: Bond[];
}

export interface ElementInfo {
  symbol: string;
  name: string;
  number: number;
  category: string;
  color: string;
}
