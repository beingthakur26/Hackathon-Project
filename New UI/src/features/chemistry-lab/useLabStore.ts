import { create } from 'zustand';
import type { Atom, Bond } from '../../data/models/lab.model';

interface LabState {
  atoms: Atom[];
  bonds: Bond[];
  selectedElement: string;
  mode: 'atom' | 'bond' | 'erase' | 'select';
  viewMode: '2d' | '3d';
  zoom: number;
  pan: { x: number; y: number };
  
  // Actions
  setMode: (mode: 'atom' | 'bond' | 'erase' | 'select') => void;
  setViewMode: (viewMode: '2d' | '3d') => void;
  setSelectedElement: (element: string) => void;
  addAtom: (x: number, y: number, z?: number) => void;
  updateAtomPosition: (id: string, x: number, y: number, z: number) => void;
  removeAtom: (id: string) => void;
  addBond: (from: string, to: string) => void;
  removeBond: (id: string) => void;
  toggleBondType: (id: string) => void;
  clear: () => void;
  setPan: (pan: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
}

export const useLabStore = create<LabState>((set) => ({
  atoms: [],
  bonds: [],
  selectedElement: 'C',
  mode: 'atom',
  viewMode: '2d',
  zoom: 1,
  pan: { x: 0, y: 0 },

  setMode: (mode) => set({ mode }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedElement: (element) => set({ selectedElement: element, mode: 'atom' }),

  addAtom: (x, y, z = 0) => set((state) => ({
    atoms: [
      ...state.atoms,
      {
        id: `atom_${Math.random().toString(36).substr(2, 9)}`,
        element: state.selectedElement,
        x,
        y,
        z,
        charge: 0,
      }
    ]
  })),

  updateAtomPosition: (id, x, y, z) => set((state) => ({
    atoms: state.atoms.map(a => a.id === id ? { ...a, x, y, z } : a)
  })),

  removeAtom: (id) => set((state) => ({
    atoms: state.atoms.filter(a => a.id !== id),
    bonds: state.bonds.filter(b => b.from !== id && b.to !== id)
  })),

  addBond: (from, to) => set((state) => {
    // Check if bond already exists
    const existing = state.bonds.find(b => 
      (b.from === from && b.to === to) || (b.from === to && b.to === from)
    );
    if (existing) return state;

    return {
      bonds: [
        ...state.bonds,
        {
          id: `bond_${Math.random().toString(36).substr(2, 9)}`,
          from,
          to,
          type: 1
        }
      ]
    };
  }),

  removeBond: (id) => set((state) => ({
    bonds: state.bonds.filter(b => b.id !== id)
  })),

  toggleBondType: (id) => set((state) => ({
    bonds: state.bonds.map(b => {
      if (b.id === id) {
        return { ...b, type: (b.type % 3 + 1) as 1 | 2 | 3 };
      }
      return b;
    })
  })),

  clear: () => set({ atoms: [], bonds: [] }),
  setPan: (pan) => set({ pan }),
  setZoom: (zoom) => set({ zoom }),
}));
