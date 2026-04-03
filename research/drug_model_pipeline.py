import pandas as pd
import numpy as np
import xgboost as xgb
from rdkit import Chem
from rdkit.Chem import Descriptors, AllChem
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score
import pickle
import os
import matplotlib.pyplot as plt
import shap

# Configure aesthetics for plots
plt.style.use('seaborn-v0_8-muted')
plt.rcParams['figure.figsize'] = (10, 6)

class DrugToxPipeline:
    def __init__(self, output_dir='models'):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
    def _canonicalize_smiles(self, smiles):
        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol:
                return Chem.MolToSmiles(mol, canonical=True)
        except:
            return None
        return None

    def _get_descriptors(self, smiles):
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
                'aromatic_rings': Descriptors.NumAromaticRings(mol)
            }
        except:
            return None

    def clean_and_prepare(self, df, smiles_col='smiles', target_col='label'):
        print(f"Cleaning data for target: {target_col}...")
        initial_len = len(df)
        
        # 1. Drop rows with missing target or SMILES
        df = df.dropna(subset=[smiles_col, target_col])
        
        # 2. Canonicalize SMILES
        df['canonical_smiles'] = df[smiles_col].apply(self._canonicalize_smiles)
        df = df.dropna(subset=['canonical_smiles'])
        
        # 3. Drop duplicates
        df = df.drop_duplicates(subset=['canonical_smiles'])
        
        # 4. Feature Extraction
        print("Extracting molecular descriptors...")
        features = df['canonical_smiles'].apply(self._get_descriptors)
        features_df = pd.DataFrame(features.tolist())
        
        # Merge features back
        df = pd.concat([df.reset_index(drop=True), features_df], axis=1)
        df = df.dropna(subset=['mol_weight']) # Ensure features were successfully extracted
        
        final_len = len(df)
        print(f"Cleaning complete. Removed {initial_len - final_len} rows. Remaining: {final_len}")
        return df

    def train_model(self, df, target_col, model_name):
        feature_cols = ['mol_weight', 'logP', 'hbd', 'hba', 'tpsa', 'qed', 'aromatic_rings']
        X = df[feature_cols]
        y = df[target_col]
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        print(f"Training XGBoost model for {model_name}...")
        model = xgb.XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            scale_pos_weight=3, # Handling class imbalance as per guide
            use_label_encoder=False,
            eval_metric='auc',
            random_state=42
        )
        
        model.fit(X_train, y_train)
        
        # Evaluation
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_prob),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred)
        }
        
        print(f"Metrics for {model_name}:")
        for k, v in metrics.items():
            print(f"  {k}: {v:.4f}")
            
        # Save model
        model_path = os.path.join(self.output_dir, f"{model_name}.pkl")
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
            
        return model, X_test, metrics

    def run_explainability(self, model, X_test, model_name):
        print(f"Generating SHAP explanations for {model_name}...")
        # Standard TreeExplainer is compatible with XGBoost 1.7.6
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test)
        
        plt.figure()
        shap.summary_plot(shap_values, X_test, show=False)
        plt.title(f"SHAP Summary: {model_name}")
        plot_path = os.path.join(self.output_dir, f"{model_name}_shap.png")
        plt.savefig(plot_path)
        print(f"SHAP plot saved to {plot_path}")

if __name__ == "__main__":
    pipeline = DrugToxPipeline()
    
    # 1. Tox21 Dataset (NR-AR target)
    if os.path.exists('tox21.csv'):
        tox21_df = pd.read_csv('tox21.csv')
        tox21_cleaned = pipeline.clean_and_prepare(tox21_df, smiles_col='smiles', target_col='NR-AR')
        model_tox21, X_test_tox21, metrics_tox21 = pipeline.train_model(tox21_cleaned, 'NR-AR', 'tox21_nrar_model')
        pipeline.run_explainability(model_tox21, X_test_tox21, 'tox21_nrar')
        
    print("-" * 50)
    
    # 2. Clintox Dataset (CT_TOX target)
    if os.path.exists('clintox.csv'):
        clintox_df = pd.read_csv('clintox.csv')
        # PDF says Clintox often has FDA_APPROVED and CT_TOX. We'll focus on CT_TOX for toxicity.
        clintox_cleaned = pipeline.clean_and_prepare(clintox_df, smiles_col='smiles', target_col='CT_TOX')
        model_clintox, X_test_clintox, metrics_clintox = pipeline.train_model(clintox_cleaned, 'CT_TOX', 'clintox_model')
        pipeline.run_explainability(model_clintox, X_test_clintox, 'clintox')
