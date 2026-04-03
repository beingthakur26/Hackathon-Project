import os
import joblib
import pandas as pd
import requests
from rdkit import Chem
from rdkit.Chem import Descriptors, AllChem
from rdkit.Chem import Draw
import base64
import io
from langchain.tools import tool

MODEL_PATH = os.path.join(os.path.dirname(__file__), '../kalki/universal_toxicity_model.pkl')

model = None
if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Warning: Could not load model: {e}")

def extract_rdkit_features(smiles: str) -> dict:
    """Extract key biological and chemical descriptors using RDKit."""
    try:
        mol = Chem.MolFromSmiles(smiles)
        if not mol:
            return None
        return {
            'mol_weight': Descriptors.MolWt(mol),
            'logP': Descriptors.MolLogP(mol),
            'hbd': Descriptors.NumHDonors(mol),
            'hba': Descriptors.NumHAcceptors(mol),
            'tpsa': Descriptors.TPSA(mol),
            'qed': Descriptors.qed(mol),
            'aromatic_rings': Descriptors.NumAromaticRings(mol),
            'num_rotatable_bonds': Descriptors.NumRotatableBonds(mol),
            'num_heavy_atoms': Descriptors.HeavyAtomCount(mol),
            'num_rings': Descriptors.RingCount(mol),
            'fraction_csp3': Descriptors.FractionCSP3(mol),
            'num_aliphatic_rings': Descriptors.NumAliphaticRings(mol),
            'num_saturated_rings': Descriptors.NumSaturatedRings(mol),
            'hallkier': Descriptors.HallKierAlpha(mol),
            'labuteASA': Descriptors.LabuteASA(mol),
            'balabanJ': Descriptors.BalabanJ(mol),
            'chi0': Descriptors.Chi0(mol),
            'chi1': Descriptors.Chi1(mol),
            'kappa1': Descriptors.Kappa1(mol),
            'kappa2': Descriptors.Kappa2(mol)
        }
    except Exception as e:
        return None

def fetch_pubchem_data(smiles: str) -> dict:
    """Fetch additional compound data from PubChem API."""
    try:
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/{requests.utils.quote(smiles)}/property/IUPACName,MolecularFormula,CanonicalSMILES/JSON"
        response = requests.get(url, timeout=10)
        if response.ok:
            data = response.json()
            props = data['PropertyTable']['Properties'][0]
            return {
                'iupac_name': props.get('IUPACName', 'N/A'),
                'molecular_formula': props.get('MolecularFormula', 'N/A'),
                'canonical_smiles': props.get('CanonicalSMILES', smiles)
            }
    except:
        pass
    return {'iupac_name': 'N/A', 'molecular_formula': 'N/A', 'canonical_smiles': smiles}

def generate_molecule_image(smiles: str) -> str:
    """Generate base64 encoded molecule image."""
    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol:
            img = Draw.MolToImage(mol, size=(400, 300))
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            return base64.b64encode(buffered.getvalue()).decode()
    except:
        pass
    return None

@tool
def predict_toxicity(smiles: str) -> str:
    """Predict toxicity of a compound given its SMILES string.
    
    Args:
        smiles: The SMILES string of the compound
        
    Returns:
        A formatted string with toxicity prediction and probability
    """
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        return "Error: Invalid SMILES string provided. Please enter a valid chemical structure."
    
    features = extract_rdkit_features(smiles)
    if features is None:
        return "Error: Failed to extract features from SMILES."
    
    pubchem_data = fetch_pubchem_data(smiles)
    
    if model is not None:
        try:
            df = pd.DataFrame([features])
            df = df[model.feature_names_in_]
            prediction = int(model.predict(df)[0])
            proba = model.predict_proba(df)[0]
            probability = float(proba[1])
            
            result = f"""## Toxicity Prediction Results

**Compound:** {pubchem_data['iupac_name']}
**SMILES:** {smiles}
**Molecular Formula:** {pubchem_data['molecular_formula']}

### Prediction:
- **Status:** {'TOXIC' if prediction == 1 else 'NON-TOXIC'}
- **Toxicity Probability:** {probability:.2%}

### Molecular Properties:
- Molecular Weight: {features['mol_weight']:.2f} g/mol
- LogP: {features['logP']:.2f}
- TPSA: {features['tpsa']:.2f} Å²
- H-Bond Donors: {features['hbd']}
- H-Bond Acceptors: {features['hba']}
- Number of Rings: {features['num_rings']}
- Aromatic Rings: {features['aromatic_rings']}

### Drug-like Properties (Lipinski's Rule of 5):
- MW <= 500: {'✓' if features['mol_weight'] <= 500 else '✗'}
- LogP <= 5: {'✓' if features['logP'] <= 5 else '✗'}
- HBD <= 5: {'✓' if features['hbd'] <= 5 else '✗'}
- HBA <= 10: {'✓' if features['hba'] <= 10 else '✗'}
"""
            return result
        except Exception as e:
            return f"Error during prediction: {str(e)}"
    else:
        return "Error: Toxicity model not loaded. Please check model file."

@tool
def calculate_properties(smiles: str) -> str:
    """Calculate molecular properties (MW, LogP, TPSA, etc.) for a compound.
    
    Args:
        smiles: The SMILES string of the compound
        
    Returns:
        A formatted string with all molecular properties
    """
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        return "Error: Invalid SMILES string provided."
    
    features = extract_rdkit_features(smiles)
    if features is None:
        return "Error: Failed to calculate properties."
    
    pubchem_data = fetch_pubchem_data(smiles)
    
    result = f"""## Molecular Properties

**Compound:** {pubchem_data['iupac_name']}
**Molecular Formula:** {pubchem_data['molecular_formula']}
**SMILES:** {smiles}

### Basic Properties:
- Molecular Weight: {features['mol_weight']:.2f} g/mol
- LogP (Partition Coefficient): {features['logP']:.2f}
- TPSA (Topological Polar Surface Area): {features['tpsa']:.2f} Å²
- Number of Heavy Atoms: {features['num_heavy_atoms']}

### Hydrogen Bonding:
- H-Bond Donors: {features['hbd']}
- H-Bond Acceptors: {features['hba']}

### Ring Properties:
- Total Rings: {features['num_rings']}
- Aromatic Rings: {features['aromatic_rings']}
- Aliphatic Rings: {features['num_aliphatic_rings']}
- Saturated Rings: {features['num_saturated_rings']}

### Flexibility:
- Rotatable Bonds: {features['num_rotatable_bonds']}
- Fraction CSP3: {features['fraction_csp3']:.2%}

### Topological Descriptors:
- Hall-Kier Alpha: {features['hallkier']:.2f}
- Kappa 1: {features['kappa1']:.2f}
- Kappa 2: {features['kappa2']:.2f}
- Chi 0: {features['chi0']:.2f}
- Chi 1: {features['chi1']:.2f}
- Labute ASA: {features['labuteASA']:.2f}
- Balaban J: {features['balabanJ']:.2f}

### Drug-like Score (QED): {features['qed']:.2f}
"""
    return result

@tool
def fetch_pubchem_info(smiles: str) -> str:
    """Fetch compound information from PubChem database.
    
    Args:
        smiles: The SMILES string of the compound
        
    Returns:
        A formatted string with PubChem data
    """
    pubchem_data = fetch_pubchem_data(smiles)
    
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        return "Error: Invalid SMILES string provided."
    
    features = extract_rdkit_features(smiles)
    
    result = f"""## PubChem Information

**IUPAC Name:** {pubchem_data['iupac_name']}
**Molecular Formula:** {pubchem_data['molecular_formula']}
**Canonical SMILES:** {pubchem_data['canonical_smiles']}
**SMILES:** {smiles}

### Quick Properties:
- Molecular Weight: {features['mol_weight']:.2f} g/mol
- LogP: {features['logP']:.2f}
- TPSA: {features['tpsa']:.2f} Å²
- Number of Rings: {features['num_rings']}

### 2D Structure:
Available as base64 encoded image (use generate_molecule_image separately)
"""
    return result

@tool
def generate_3d_structure(smiles: str) -> str:
    """Generate 3D molecular structure coordinates.
    
    Args:
        smiles: The SMILES string of the compound
        
    Returns:
        A message indicating the 3D structure is ready for visualization
    """
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        return "Error: Invalid SMILES string provided. Cannot generate 3D structure."
    
    try:
        mol = Chem.AddHs(mol)
        AllChem.EmbedMolecule(mol, randomSeed=42)
        AllChem.MMFFOptimizeMolecule(mol)
        
        num_atoms = mol.GetNumAtoms()
        num_bonds = mol.GetNumBonds()
        
        result = f"""## 3D Structure Generated

**SMILES:** {smiles}
**Number of Atoms:** {num_atoms}
**Number of Bonds:** {num_bonds}

The 3D coordinates have been generated and are available for visualization.
Use the /molecule/3d/{{smiles}} endpoint to get the SDF data for rendering in a 3D molecular viewer.

### 3D Structure Details:
- Hydrogens added: Yes
- Energy minimized: MMFF94 force field
- Embedding method: ETKDGv3
"""
        return result
    except Exception as e:
        return f"Error generating 3D structure: {str(e)}"

@tool
def generate_compound(requirements: str) -> str:
    """Generate new drug-like compound SMILES based on user requirements.
    
    Args:
        requirements: Description of desired compound properties (e.g., "analgesic with MW < 400")
        
    Returns:
        A formatted string with generated SMILES and validation
    """
    return f"""## Compound Generation

**Your Requirements:** {requirements}

Note: AI-powered compound generation requires the Mistral agent to generate valid SMILES.
Please use the /agent/chat endpoint to interact with the Chemistry Expert agent,
which will use AI to generate appropriate SMILES based on your requirements.

For now, here are some common drug-like SMILES for reference:

1. **Aspirin:** CC(=O)OC1=CC=CC=C1C(=O)O
2. **Ibuprofen:** CC(C)Cc1ccc(cc1)C(C)C(=O)O
3. **Caffeine:** CN1C=NC2=C1C(=O)N(C(=O)N2C)C
4. **Morphine:** CN1CCC23C4C1CC5=C2C(=C(C=C5)OC3C(C=C4)O)O
5. **Paracetamol:** CC(=O)NC1=CC=C(C=C1)O
6. **Nicotine:** CN1CCC=C2C1=CC=C2
7. **Glucose:** C(C1C(C(C(C(O1)O)O)O)O)O
8. **Ciprofloxacin:**OC(=O)C1CN(C2=C3C1C=CC2=C(F)C(=(O)N4C3NCC4=O)F)F

Please consult the Chemistry Expert agent for specific compound generation.
"""

@tool
def search_compounds(query: str) -> str:
    """Search for drugs and compounds by name or description.
    
    Args:
        query: Search term (drug name, category, or description)
        
    Returns:
        A formatted string with search results
    """
    popular_drugs = {
        "aspirin": {"smiles": "CC(=O)OC1=CC=CC=C1C(=O)O", "category": "Analgesic", "description": "Pain reliever and anti-inflammatory"},
        "ibuprofen": {"smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O", "category": "NSAID", "description": "Non-steroidal anti-inflammatory drug"},
        "paracetamol": {"smiles": "CC(=O)NC1=CC=C(C=C1)O", "category": "Analgesic", "description": "Acetaminophen - fever reducer and pain reliever"},
        "caffeine": {"smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C", "category": "Stimulant", "description": "Natural stimulant found in coffee"},
        "morphine": {"smiles": "CN1CCC23C4C1CC5=C2C(=C(C=C5)OC3C(C=C4)O)O", "category": "Analgesic", "description": "Opioid pain medication"},
        "metformin": {"smiles": "CN(C)C(=N)N", "category": "Antidiabetic", "description": "First-line medication for type 2 diabetes"},
        "lisinopril": {"smiles": "C(C(C)C)C(C)C", "category": "ACE Inhibitor", "description": "Blood pressure medication"},
        "atorvastatin": {"smiles": "CC(C)C1=C(C=CC=C1C(=O)OCC(N)CC(C)C)", "category": "Statin", "description": "Cholesterol-lowering medication"},
        "amoxicillin": {"smiles": "CC1(C)N2C(C1=O)NC(C2=O)OC(C)C", "category": "Antibiotic", "description": "Penicillin-type antibiotic"},
        "omeprazole": {"smiles": "COc1ccc2c(c1)C(=O)N(CC2)C(C)O", "category": "PPI", "description": "Proton pump inhibitor for acid reflux"},
    }
    
    query_lower = query.lower()
    results = []
    
    for name, info in popular_drugs.items():
        if query_lower in name or query_lower in info["category"].lower() or query_lower in info["description"].lower():
            results.append(f"- **{name.capitalize()}**: {info['smiles']} ({info['category']}) - {info['description']}")
    
    if results:
        return f"""## Search Results for &quot;{query}&quot;

{chr(10).join(results)}

Use these SMILES strings with the predict_toxicity tool to analyze any compound.
"""
    else:
        return f"""## No Results Found for &quot;{query}&quot;

Try searching for common drugs like:
- Aspirin, Ibuprofen, Paracetamol (pain relievers)
- Caffeine, Nicotine (stimulants)
- Metformin, Lisinopril (cardiovascular)
- Amoxicillin (antibiotics)

Or use the predict_toxicity tool directly with a SMILES string.
"""

@tool
def get_app_state() -> str:
    """Get the current state of the application including navigation and form states.
    
    Returns:
        A formatted string describing the current app state
    """
    return """## Application State

The ToxinAI application has the following pages:
- **Dashboard**: Overview and statistics
- **Analyzer**: Main toxicity prediction tool
- **Chemistry Lab**: Create and experiment with molecular formulas
- **Explore**: Search for drugs and compounds
- **History**: View past analysis results

To navigate or set values:
- Use the navigate_to action in the UI
- Set SMILES in Analyzer or Chemistry Lab using the appropriate form fields
- Ask me to &quot;go to [page]&quot; or &quot;analyze [SMILES]&quot;
"""
