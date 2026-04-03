import os
from dotenv import load_dotenv
load_dotenv()

from typing import List, Dict, Any
from langchain_mistralai import ChatMistralAI
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, AIMessage
from rdkit import Chem

from tools import (
    predict_toxicity,
    generate_compound,
    calculate_properties,
    fetch_pubchem_info,
    generate_3d_structure,
    search_compounds,
    get_app_state
)

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
CHEMISTRY_EXPERT_PROMPT = """You are an expert medicinal chemist with deep knowledge of:
- Drug discovery and development
- Molecular toxicity prediction
- ADMET properties (Absorption, Distribution, Metabolism, Excretion, Toxicity)
- Chemical structure-activity relationships
- Pharmaceutical chemistry
- QSAR (Quantitative Structure-Activity Relationship) modeling

You have access to tools that can:
1. predict_toxicity(smiles) - Predict toxicity of any compound from its SMILES string
2. generate_compound(requirements) - Generate new drug-like compounds based on requirements
3. calculate_properties(smiles) - Calculate molecular properties (MW, LogP, TPSA, etc.)
4. fetch_pubchem_info(smiles) - Fetch compound information from PubChem database
5. generate_3d_structure(smiles) - Generate 3D molecular structures for visualization
6. search_compounds(query) - Search for drugs and compounds by name or description
7. get_app_state() - Get current application state and navigation info

When a user asks about:
- Toxicity: ALWAYS use the predict_toxicity tool with the SMILES
- New compounds: Use generate_compound, then validate with calculate_properties and predict_toxicity
- Properties: Use calculate_properties
- 3D structures: Use generate_3d_structure to get coordinates
- PubChem data: Use fetch_pubchem_info
- Searching for drugs: Use search_compounds
- Navigation or app state: Use get_app_state

IMPORTANT:
- Always ask for SMILES if not provided
- Validate all SMILES strings using RDKit before processing
- Provide comprehensive analysis including Lipinski's Rule of 5
- Explain your reasoning clearly
- Be helpful, precise, and scientifically accurate

Your goal is to help researchers discover safe, effective drug candidates by providing:
1. Toxicity predictions
2. Property calculations
3. Drug-likeness assessment
4. Compound generation suggestions
5. 3D structure visualization support
6. Navigation assistance across the ToxinAI application
"""

class ChemistryAgent:
    def __init__(self):
        self.llm = None
        self.agent = None
        self._initialize()
    
    def _initialize(self):
        if not MISTRAL_API_KEY:
            print("Warning: MISTRAL_API_KEY not set")
            return
        
        try:
            self.llm = ChatMistralAI(
                model="mistral-small-latest",
                api_key=MISTRAL_API_KEY,
                temperature=0.7,
                max_retries=2
            )
            
            tools = [
                predict_toxicity,
                generate_compound,
                calculate_properties,
                fetch_pubchem_info,
                generate_3d_structure,
                search_compounds,
                get_app_state
            ]
            
            self.agent = create_react_agent(
                self.llm,
                tools,
                prompt=CHEMISTRY_EXPERT_PROMPT
            )
            print("Chemistry Agent initialized successfully")
        except Exception as e:
            print(f"Error initializing agent: {e}")
    
    def chat(self, message: str, history: List[Dict] = None) -> str:
        """Chat with the chemistry expert agent"""
        if self.agent is None:
            return "Error: Chemistry Agent not initialized. Please check MISTRAL_API_KEY."
        
        try:
            messages = [("system", CHEMISTRY_EXPERT_PROMPT)]
            
            if history:
                for msg in history:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role == "user":
                        messages.append(HumanMessage(content=content))
                    else:
                        messages.append(AIMessage(content=content))
            
            messages.append(HumanMessage(content=message))
            
            result = self.agent.invoke({"messages": messages})
            
            response = result["messages"][-1].content
            return response
        except Exception as e:
            return f"Error during chat: {str(e)}"
    
    def generate_compound_ai(self, requirements: str) -> str:
        """Use AI to generate compound SMILES based on requirements"""
        if self.llm is None:
            return "Error: LLM not initialized."
        
        prompt = f"""Generate a valid SMILES string for a drug-like compound with the following requirements:
{requirements}

Respond ONLY with the SMILES string and a brief description. Do not include any other text.
Make sure the SMILES is valid and can be parsed by RDKit.
"""
        try:
            response = self.llm.invoke(prompt)
            smiles = response.content.strip().split('\n')[0].strip()
            
            mol = Chem.MolFromSmiles(smiles)
            if mol:
                return f"Generated SMILES: {smiles}"
            else:
                return "Error: Generated SMILES is not valid. Please try again."
        except Exception as e:
            return f"Error generating compound: {str(e)}"


chemistry_agent = ChemistryAgent()

def get_agent():
    """Get the chemistry agent instance"""
    return chemistry_agent
