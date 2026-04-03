import pandas as pd
import numpy as np
import os
from rdkit import Chem
from rdkit.Chem import Descriptors
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score, f1_score
import joblib
import warnings
warnings.filterwarnings('ignore')

DATA_DIR = "/home/karanpc/Desktop/AI_Drug_Toxicity"
OUTPUT_DIR = os.path.join(DATA_DIR, "kalki")

os.makedirs(OUTPUT_DIR, exist_ok=True)

def canonicalize_smiles(smiles):
    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol:
            return Chem.MolToSmiles(mol, canonical=True)
    except:
        return None
    return None

def extract_features(smiles):
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

print("=" * 60)
print("STEP 1: Loading Datasets")
print("=" * 60)

clintox_df = pd.read_csv(os.path.join(DATA_DIR, "clintox.csv"))
tox21_df = pd.read_csv(os.path.join(DATA_DIR, "tox21.csv"))

print(f"Clintox: {len(clintox_df)} compounds")
print(f"Tox21: {len(tox21_df)} compounds")

print("\n" + "=" * 60)
print("STEP 2: Creating Combined Dataset with Unified Labels")
print("=" * 60)

clintox_df = clintox_df.dropna(subset=['smiles'])
clintox_df['canonical_smiles'] = clintox_df['smiles'].apply(canonicalize_smiles)
clintox_df = clintox_df.dropna(subset=['canonical_smiles'])
clintox_df['CT_TOX'] = clintox_df['CT_TOX'].fillna(0)
clintox_df['any_tox_clintox'] = clintox_df['CT_TOX'].apply(lambda x: 1 if x == 1 else 0)
clintox_df = clintox_df[['canonical_smiles', 'any_tox_clintox', 'FDA_APPROVED']].rename(
    columns={'canonical_smiles': 'smiles', 'any_tox_clintox': 'clintox_tox'})
clintox_df['source'] = 'clintox'

tox21_cols = ['NR-AR', 'NR-AR-LBD', 'NR-AhR', 'NR-Aromatase', 'NR-ER', 'NR-ER-LBD', 
              'NR-PPAR-gamma', 'SR-ARE', 'SR-ATAD5', 'SR-HSE', 'SR-MMP', 'SR-p53']
tox21_df = tox21_df.dropna(subset=['smiles'])
tox21_df['canonical_smiles'] = tox21_df['smiles'].apply(canonicalize_smiles)
tox21_df = tox21_df.dropna(subset=['canonical_smiles'])

for col in tox21_cols:
    tox21_df[col] = tox21_df[col].fillna(0)

tox21_df['any_tox_tox21'] = tox21_df[tox21_cols].max(axis=1)
tox21_df = tox21_df[['canonical_smiles', 'any_tox_tox21']].rename(
    columns={'canonical_smiles': 'smiles', 'any_tox_tox21': 'tox21_tox'})
tox21_df['source'] = 'tox21'

combined_df = pd.concat([clintox_df[['smiles', 'clintox_tox', 'source']], 
                         tox21_df[['smiles', 'tox21_tox', 'source']]], ignore_index=True)

combined_df = combined_df.drop_duplicates(subset=['smiles'])
combined_df['any_toxicity'] = combined_df.apply(
    lambda x: 1 if (x.get('clintox_tox', 0) == 1 or x.get('tox21_tox', 0) == 1) else 0, axis=1)

print(f"Combined dataset: {len(combined_df)} unique compounds")
print(f"Toxic compounds: {combined_df['any_toxicity'].sum()}")
print(f"Non-toxic compounds: {len(combined_df) - combined_df['any_toxicity'].sum()}")
print(f"Toxicity ratio: {combined_df['any_toxicity'].mean()*100:.1f}%")

print("\n" + "=" * 60)
print("STEP 3: Extracting Molecular Features")
print("=" * 60)

combined_df = combined_df.reset_index(drop=True)

features_list = []
valid_indices = []

for idx, smiles in enumerate(combined_df['smiles']):
    feats = extract_features(smiles)
    features_list.append(feats)
    if feats is not None:
        valid_indices.append(idx)

features_df = pd.DataFrame(features_list)

combined_df = combined_df.iloc[valid_indices].reset_index(drop=True)
features_df = features_df.iloc[valid_indices].reset_index(drop=True)

print(f"Valid compounds after feature extraction: {len(combined_df)}")

print("\n" + "=" * 60)
print("STEP 4: Training XGBoost Model")
print("=" * 60)

X = features_df
y = combined_df['any_toxicity']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

print(f"Training set: {len(X_train)} samples")
print(f"Test set: {len(X_test)} samples")

scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
print(f"Class imbalance ratio: {scale_pos_weight:.2f}")

model = xgb.XGBClassifier(
    n_estimators=500,
    max_depth=8,
    learning_rate=0.03,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.1,
    reg_alpha=0.1,
    reg_lambda=1.0,
    scale_pos_weight=scale_pos_weight,
    eval_metric='auc',
    random_state=42,
    use_label_encoder=False
)

model.fit(X_train, y_train, 
          eval_set=[(X_test, y_test)],
          verbose=50)

print("\n" + "=" * 60)
print("STEP 5: Model Evaluation")
print("=" * 60)

y_prob = model.predict_proba(X_test)[:, 1]
y_pred = model.predict(X_test)

roc_auc = roc_auc_score(y_test, y_prob)
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print(f"ROC-AUC: {roc_auc:.4f}")
print(f"Accuracy: {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1 Score: {f1:.4f}")

print("\n" + "=" * 60)
print("STEP 6: Saving Model")
print("=" * 60)

model_path = os.path.join(OUTPUT_DIR, "universal_toxicity_model.pkl")
joblib.dump(model, model_path)
print(f"Model saved to: {model_path}")

model_info = {
    'feature_names': list(X.columns),
    'feature_count': len(X.columns),
    'training_samples': len(X_train),
    'test_samples': len(X_test),
    'metrics': {
        'roc_auc': roc_auc,
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }
}

info_path = os.path.join(OUTPUT_DIR, "model_info.pkl")
joblib.dump(model_info, info_path)
print(f"Model info saved to: {info_path}")

combined_df.to_csv(os.path.join(OUTPUT_DIR, "combined_dataset.csv"), index=False)
features_df.to_csv(os.path.join(OUTPUT_DIR, "extracted_features.csv"), index=False)
print(f"Dataset saved to: {OUTPUT_DIR}")

print("\n" + "=" * 60)
print("TRAINING COMPLETE!")
print("=" * 60)