import json
import base64
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit.Chem import Draw
import io

def generate_3d_coords(smiles: str) -> dict:
    """Generate 3D molecular coordinates from SMILES.
    
    Args:
        smiles: The SMILES string of the compound
        
    Returns:
        Dictionary with atoms, bonds, and metadata
    """
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        return {"error": "Invalid SMILES string"}
    
    try:
        mol = Chem.AddHs(mol)
        AllChem.EmbedMolecule(mol, randomSeed=42)
        AllChem.MMFFOptimizeMolecule(mol)
        
        conf = mol.GetConformer(0)
        
        atoms = []
        for atom in mol.GetAtoms():
            pos = conf.GetAtomPosition(atom.GetIdx())
            atoms.append({
                "id": atom.GetIdx(),
                "element": atom.GetSymbol(),
                "x": round(float(pos.x), 4),
                "y": round(float(pos.y), 4),
                "z": round(float(pos.z), 4),
                "atomic_number": atom.GetAtomicNum(),
                "formal_charge": atom.GetFormalCharge(),
                "hybridization": str(atom.GetHybridization()),
                "aromatic": atom.GetIsAromatic()
            })
        
        bonds = []
        for bond in mol.GetBonds():
            bonds.append({
                "id": bond.GetIdx(),
                "atoms": [bond.GetBeginAtomIdx(), bond.GetEndAtomIdx()],
                "type": bond.GetBondTypeAsDouble(),
                "type_str": str(bond.GetBondType()),
                "aromatic": bond.GetIsAromatic(),
                "conjugated": bond.GetIsConjugated()
            })
        
        return {
            "smiles": smiles,
            "num_atoms": len(atoms),
            "num_bonds": len(bonds),
            "atoms": atoms,
            "bonds": bonds,
            "status": "success"
        }
    except Exception as e:
        return {"error": f"Error generating 3D coordinates: {str(e)}"}

def generate_sdf_string(smiles: str) -> str:
    """Generate SDF format string for 3Dmol.js visualization.
    
    Args:
        smiles: The SMILES string of the compound
        
    Returns:
        SDF format string
    """
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        return ""
    
    try:
        mol = Chem.AddHs(mol)
        AllChem.EmbedMolecule(mol, randomSeed=42)
        AllChem.MMFFOptimizeMolecule(mol)
        sdf = Chem.MolToMolBlock(mol)
        return sdf
    except Exception as e:
        return ""

def generate_molblock_with_coords(smiles: str) -> dict:
    """Generate complete molecular data for 3D visualization.
    
    Args:
        smiles: The SMILES string of the compound
        
    Returns:
        Dictionary with SDF, coordinates, and metadata
    """
    coords = generate_3d_coords(smiles)
    sdf = generate_sdf_string(smiles)
    sdf_base64 = base64.b64encode(sdf.encode()).decode() if sdf else ""
    
    mol = Chem.MolFromSmiles(smiles)
    if mol:
        num_heavy_atoms = mol.GetNumHeavyAtoms()
        num_h_atoms = mol.GetNumAtoms() - num_heavy_atoms
    else:
        num_heavy_atoms = 0
        num_h_atoms = 0
    
    return {
        "smiles": smiles,
        "sdf": sdf,
        "sdf_base64": sdf_base64,
        "coordinates": coords,
        "num_heavy_atoms": num_heavy_atoms,
        "num_hydrogens": num_h_atoms,
        "status": "success" if sdf else "error"
    }

def get_2d_coordinates(smiles: str) -> dict:
    """Generate 2D molecular coordinates for display.
    
    Args:
        smiles: The SMILES string of the compound
        
    Returns:
        Dictionary with 2D coordinates
    """
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        return {"error": "Invalid SMILES string"}
    
    try:
        AllChem.Compute2DCoords(mol)
        
        atoms = []
        for atom in mol.GetAtoms():
            atoms.append({
                "id": atom.GetIdx(),
                "element": atom.GetSymbol(),
                "atomic_number": atom.GetAtomicNum()
            })
        
        bonds = []
        for bond in mol.GetBonds():
            bonds.append({
                "atoms": [bond.GetBeginAtomIdx(), bond.GetEndAtomIdx()],
                "type": bond.GetBondTypeAsDouble()
            })
        
        conf = mol.GetConformer(0)
        coords_2d = []
        for i in range(mol.GetNumAtoms()):
            pos = conf.GetAtomPosition(i)
            coords_2d.append({
                "x": round(float(pos.x), 4),
                "y": round(float(pos.y), 4)
            })
        
        return {
            "smiles": smiles,
            "atoms": atoms,
            "bonds": bonds,
            "coordinates_2d": coords_2d,
            "status": "success"
        }
    except Exception as e:
        return {"error": f"Error generating 2D coordinates: {str(e)}"}
