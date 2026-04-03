from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import joblib
import pandas as pd
import os
import requests
from rdkit import Chem
from rdkit.Chem import Descriptors, Draw
from rdkit.Chem import AllChem
import base64
import io
import uuid
from datetime import datetime

from database import connect_to_mongo, get_db
from routes import auth_router, history_router

def extract_rdkit_features(smiles):
    """Extracts key biological and chemical descriptors using RDKit."""
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
    except:
        return None

def fetch_pubchem_data(smiles: str) -> Dict:
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

app = FastAPI(title="ToxinAI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), '../kalki/universal_toxicity_model.pkl')
model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print(f"Model loaded from {MODEL_PATH}")
else:
    print("Warning: Model not found at", MODEL_PATH)

@app.on_event("startup")
async def startup():
    connect_to_mongo()

app.include_router(auth_router)
app.include_router(history_router)

class DrugFeatures(BaseModel):
    mol_weight: float
    logP: float
    hbd: float
    hba: float
    tpsa: float
    qed: float
    aromatic_rings: float
    num_rotatable_bonds: float
    num_heavy_atoms: float
    num_rings: float
    fraction_csp3: float
    num_aliphatic_rings: float
    num_saturated_rings: float
    hallkier: float
    labuteASA: float
    balabanJ: float
    chi0: float
    chi1: float
    kappa1: float
    kappa2: float

@app.post("/predict/")
def predict(features: DrugFeatures):
    if model is None:
        return {"error": "Model not loaded."}
    df = pd.DataFrame([features.dict()])
    df = df[model.feature_names_in_]
    prediction = model.predict(df)[0]
    return {"prediction": int(prediction)}

@app.post("/predict-batch/")
def predict_batch(file: UploadFile = File(...)):
    if model is None:
        return {"error": "Model not loaded."}
    df = pd.read_csv(file.file)
    if 'smiles' in df.columns:
        features_list = []
        for smiles in df['smiles']:
            feats = extract_rdkit_features(smiles)
            if feats:
                features_list.append(feats)
            else:
                features_list.append({k: 0.0 for k in model.feature_names_in_})
        df = pd.DataFrame(features_list)
    else:
        expected_features = model.feature_names_in_
        df = df[expected_features]
        df = df.astype(float)
    df = df[model.feature_names_in_]
    predictions = model.predict(df)
    return {"predictions": predictions.tolist()}

@app.get("/")
def root():
    return {"message": "ToxinAI API v2.0.0", "status": "running"}

class SMILESInput(BaseModel):
    smiles: str

@app.post("/predict-smiles/")
def predict_from_smiles(input_data: SMILESInput):
    """Predict toxicity directly from SMILES string - auto extracts features."""
    smiles = input_data.smiles.strip()
    
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        raise HTTPException(status_code=400, detail="Invalid SMILES string. Please enter a valid chemical structure.")
    
    features = extract_rdkit_features(smiles)
    if features is None:
        raise HTTPException(status_code=500, detail="Failed to extract features from SMILES.")
    
    prediction = None
    probability = None
    if model is not None:
        df = pd.DataFrame([features])
        df = df[model.feature_names_in_]
        prediction = int(model.predict(df)[0])
        proba = model.predict_proba(df)[0]
        probability = float(proba[1])
    
    pubchem_data = fetch_pubchem_data(smiles)
    mol_image = generate_molecule_image(smiles)
    
    return {
        "smiles": smiles,
        "canonical_smiles": pubchem_data['canonical_smiles'],
        "iupac_name": pubchem_data['iupac_name'],
        "molecular_formula": pubchem_data['molecular_formula'],
        "molecule_image": mol_image,
        "features": features,
        "prediction": prediction,
        "toxicity_probability": probability,
        "prediction_label": "Toxic" if prediction == 1 else "Non-Toxic" if prediction == 0 else "Model not loaded"
    }

@app.get("/compound-info/{smiles}")
def get_compound_info(smiles: str):
    """Get compound information from PubChem."""
    smiles = requests.utils.unquote(smiles)
    pubchem_data = fetch_pubchem_data(smiles)
    mol_image = generate_molecule_image(smiles)
    return {
        "smiles": smiles,
        **pubchem_data,
        "molecule_image": mol_image
    }

@app.get("/search/{query}")
def search_compound(query: str):
    """Search compounds in PubChem by name."""
    try:
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{requests.utils.quote(query)}/property/IUPACName,CanonicalSMILES,MolecularFormula/JSON"
        response = requests.get(url, timeout=10)
        if response.ok:
            data = response.json()
            props = data['PropertyTable']['Properties']
            results = []
            for p in props[:10]:
                results.append({
                    'name': p.get('IUPACName', p.get('CanonicalSMILES', 'Unknown')),
                    'smiles': p.get('CanonicalSMILES', ''),
                    'formula': p.get('MolecularFormula', 'N/A')
                })
            return {"results": results}
        else:
            return {"results": [], "message": "No compounds found"}
    except Exception as e:
        return {"results": [], "message": str(e)}

from agent import chemistry_agent

class AgentInput(BaseModel):
    message: str
    history: Optional[List[Dict]] = []

class AgentGenerateInput(BaseModel):
    requirements: str

@app.post("/agent/chat")
def chat_with_chemistry_agent(input_data: AgentInput):
    """Chat with the Chemistry Expert AI Agent"""
    history = input_data.history if input_data.history else []
    response = chemistry_agent.chat(input_data.message, history)
    return {"response": response}

@app.post("/agent/generate")
def agent_generate_compound(input_data: AgentGenerateInput):
    """Generate new compound using AI agent"""
    response = chemistry_agent.generate_compound_ai(input_data.requirements)
    return {"response": response}

from visualization import generate_molblock_with_coords, get_2d_coordinates, generate_sdf_string

@app.get("/molecule/3d/{smiles}")
def get_3d_molecule(smiles: str):
    """Get 3D molecular structure for visualization"""
    smiles = requests.utils.unquote(smiles)
    data = generate_molblock_with_coords(smiles)
    return data

@app.get("/molecule/2d/{smiles}")
def get_2d_molecule(smiles: str):
    """Get 2D molecular coordinates"""
    smiles = requests.utils.unquote(smiles)
    return get_2d_coordinates(smiles)

@app.get("/molecule/sdf/{smiles}")
def get_sdf(smiles: str):
    """Get SDF format string for 3D visualization"""
    smiles = requests.utils.unquote(smiles)
    sdf = generate_sdf_string(smiles)
    return {"sdf": sdf}

from tools import predict_toxicity, calculate_properties, fetch_pubchem_info, generate_3d_structure

@app.post("/tools/toxicity")
def tool_predict_toxicity(input_data: SMILESInput):
    """Direct toxicity prediction using tools"""
    result = predict_toxicity.invoke({"smiles": input_data.smiles})
    return {"result": result}

@app.post("/tools/properties")
def tool_calculate_properties(input_data: SMILESInput):
    """Direct property calculation using tools"""
    result = calculate_properties.invoke({"smiles": input_data.smiles})
    return {"result": result}

@app.post("/tools/pubchem")
def tool_fetch_pubchem(input_data: SMILESInput):
    """Direct PubChem fetch using tools"""
    result = fetch_pubchem_info.invoke({"smiles": input_data.smiles})
    return {"result": result}

@app.post("/tools/3dstructure")
def tool_generate_3d(input_data: SMILESInput):
    """Direct 3D structure generation using tools"""
    result = generate_3d_structure.invoke({"smiles": input_data.smiles})
    return {"result": result}


class FormulaCreate(BaseModel):
    smiles: str
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = []
    parent_compounds: Optional[List[str]] = []

experiments_db = {}

@app.post("/experiments/formula")
def create_formula(data: FormulaCreate):
    """Create a new formula in Chemistry Lab"""
    mol = Chem.MolFromSmiles(data.smiles)
    if not mol:
        raise HTTPException(status_code=400, detail="Invalid SMILES string")
    
    formula_id = str(uuid.uuid4())
    formula = {
        "id": formula_id,
        "smiles": data.smiles,
        "name": data.name or "Untitled Formula",
        "description": data.description or "",
        "tags": data.tags or [],
        "parent_compounds": data.parent_compounds or [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    experiments_db[formula_id] = formula
    return formula

@app.get("/experiments/formulas")
def get_formulas(skip: int = 0, limit: int = 50):
    """Get all formulas"""
    formulas = list(experiments_db.values())
    formulas.sort(key=lambda x: x["updated_at"], reverse=True)
    return {"formulas": formulas[skip:skip+limit], "total": len(formulas)}

@app.get("/experiments/formula/{formula_id}")
def get_formula(formula_id: str):
    """Get a specific formula"""
    if formula_id not in experiments_db:
        raise HTTPException(status_code=404, detail="Formula not found")
    return experiments_db[formula_id]

@app.put("/experiments/formula/{formula_id}")
def update_formula(formula_id: str, data: FormulaCreate):
    """Update a formula"""
    if formula_id not in experiments_db:
        raise HTTPException(status_code=404, detail="Formula not found")
    
    if data.smiles:
        mol = Chem.MolFromSmiles(data.smiles)
        if not mol:
            raise HTTPException(status_code=400, detail="Invalid SMILES string")
    
    experiments_db[formula_id].update({
        "smiles": data.smiles,
        "name": data.name,
        "description": data.description,
        "tags": data.tags or [],
        "parent_compounds": data.parent_compounds or [],
        "updated_at": datetime.utcnow().isoformat()
    })
    return experiments_db[formula_id]

@app.delete("/experiments/formula/{formula_id}")
def delete_formula(formula_id: str):
    """Delete a formula"""
    if formula_id not in experiments_db:
        raise HTTPException(status_code=404, detail="Formula not found")
    del experiments_db[formula_id]
    return {"message": "Formula deleted"}


popular_drugs_db = {
    "aspirin": {"name": "Aspirin", "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O", "category": "Analgesic", "description": "Pain reliever and anti-inflammatory"},
    "ibuprofen": {"name": "Ibuprofen", "smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O", "category": "NSAID", "description": "Non-steroidal anti-inflammatory drug"},
    "paracetamol": {"name": "Paracetamol", "smiles": "CC(=O)NC1=CC=C(C=C1)O", "category": "Analgesic", "description": "Acetaminophen - fever reducer"},
    "caffeine": {"name": "Caffeine", "smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C", "category": "Stimulant", "description": "Natural stimulant found in coffee"},
    "morphine": {"name": "Morphine", "smiles": "CN1CCC23C4C1CC5=C2C(=C(C=C5)OC3C(C=C4)O)O", "category": "Analgesic", "description": "Opioid pain medication"},
    "metformin": {"name": "Metformin", "smiles": "CN(C)C(=N)N", "category": "Antidiabetic", "description": "First-line medication for type 2 diabetes"},
    "lisinopril": {"name": "Lisinopril", "smiles": "C(C(C)C)C(C)C", "category": "ACE Inhibitor", "description": "Blood pressure medication"},
    "atorvastatin": {"name": "Atorvastatin", "smiles": "CC(C)C1=C(C=CC=C1C(=O)OCC(N)CC(C)C)", "category": "Statin", "description": "Cholesterol-lowering medication"},
    "amoxicillin": {"name": "Amoxicillin", "smiles": "CC1(C)N2C(C1=O)NC(C2=O)OC(C)C", "category": "Antibiotic", "description": "Penicillin-type antibiotic"},
    "omeprazole": {"name": "Omeprazole", "smiles": "COc1ccc2c(c1)C(=O)N(CC2)C(C)O", "category": "PPI", "description": "Proton pump inhibitor for acid reflux"},
    "nicotine": {"name": "Nicotine", "smiles": "CN1CCC=C2C1=CC=C2", "category": "Stimulant", "description": "Alkaloid found in tobacco"},
    "glucose": {"name": "Glucose", "smiles": "OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O", "category": "Carbohydrate", "description": "Simple sugar - primary energy source"},
    "benzene": {"name": "Benzene", "smiles": "c1ccccc1", "category": "Aromatic Hydrocarbon", "description": "Basic aromatic compound"},
    "ethanol": {"name": "Ethanol", "smiles": "CCO", "category": "Alcohol", "description": "Simple alcohol - alcoholic beverages"},
    "acetone": {"name": "Acetone", "smiles": "CC(=O)C", "category": "Ketone", "description": "Common organic solvent"},
}

@app.get("/explore/search/{query}")
def explore_search(query: str):
    """Search for drugs and compounds"""
    query_lower = query.lower()
    results = []
    
    for key, drug in popular_drugs_db.items():
        if query_lower in key or query_lower in drug["name"].lower() or query_lower in drug["category"].lower():
            results.append({
                "name": drug["name"],
                "smiles": drug["smiles"],
                "category": drug["category"],
                "description": drug["description"]
            })
    
    try:
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{requests.utils.quote(query)}/property/IUPACName,CanonicalSMILES,MolecularFormula/JSON"
        response = requests.get(url, timeout=10)
        if response.ok:
            data = response.json()
            for p in data.get('PropertyTable', {}).get('Properties', [])[:5]:
                smiles = p.get('CanonicalSMILES', '')
                features = extract_rdkit_features(smiles) if smiles else None
                results.append({
                    "name": p.get('IUPACName', 'Unknown'),
                    "smiles": smiles,
                    "molecular_formula": p.get('MolecularFormula', 'N/A'),
                    "category": "PubChem",
                    "description": features.get('mol_weight', 0) if features else None
                })
    except:
        pass
    
    return {"results": results[:20]}

@app.get("/explore/categories")
def explore_categories():
    """Get drug categories"""
    categories = {
        "Analgesics": {"icon": "brain", "color": "red", "description": "Pain relievers"},
        "Antibiotics": {"icon": "shield", "color": "green", "description": "Anti-bacterial agents"},
        "Stimulants": {"icon": "activity", "color": "yellow", "description": "CNS stimulants"},
        "Antivirals": {"icon": "shield", "color": "blue", "description": "Anti-viral agents"},
        "Antidepressants": {"icon": "heart", "color": "purple", "description": "Mood regulators"},
        "Cardiovascular": {"icon": "heart", "color": "rose", "description": "Heart medications"},
    }
    return {"categories": categories}

@app.get("/explore/drug/{name}")
def explore_drug(name: str):
    """Get detailed drug information"""
    name_lower = name.lower()
    
    if name_lower in popular_drugs_db:
        drug = popular_drugs_db[name_lower]
        features = extract_rdkit_features(drug["smiles"])
        pubchem_data = fetch_pubchem_data(drug["smiles"])
        mol_image = generate_molecule_image(drug["smiles"])
        
        return {
            "name": drug["name"],
            "smiles": drug["smiles"],
            "category": drug["category"],
            "description": drug["description"],
            "iupac_name": pubchem_data.get("iupac_name", "N/A"),
            "molecular_formula": pubchem_data.get("molecular_formula", "N/A"),
            "features": features,
            "molecule_image": mol_image
        }
    
    raise HTTPException(status_code=404, detail="Drug not found")
