import os
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import hashlib
import secrets

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "")
print("Mongo URL :",MONGODB_URL) 
client = None
db = None
use_fallback = False

in_memory_users = {}
in_memory_history = []
user_counter = 1
history_counter = 1

def hash_password(password: str) -> str:
    # Use consistent 72-byte truncation as in auth.py
    password_bytes = password.encode('utf-8')[:72]
    return hashlib.sha256(password_bytes).hexdigest()

def connect_to_mongo():
    global client, db, use_fallback
    try:
        client = MongoClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        client.admin.command('ping')
        db = client["toxintox"]
        db.users.create_index("email", unique=True)
        db.history.create_index("user_id")
        db.history.create_index("created_at")
        print("Connected to MongoDB successfully!")
        use_fallback = False
        return db
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        print("Using in-memory fallback database...")
        use_fallback = True
        return None

def get_db():
    global db
    if db is None and not use_fallback:
        db = connect_to_mongo()
    return db if not use_fallback else None

def is_fallback():
    return use_fallback

def create_user_fallback(email: str, password: str, name: str = None):
    global user_counter
    user_id = str(user_counter)
    user_counter += 1
    user = {
        "_id": user_id,
        "email": email,
        "password": hash_password(password),
        "name": name,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    in_memory_users[user_id] = user
    in_memory_users[email] = user
    return user

def find_user_by_email_fallback(email: str):
    return in_memory_users.get(email)

def find_user_by_id_fallback(user_id: str):
    return in_memory_users.get(user_id)

def create_history_fallback(user_id: str, data: dict):
    global history_counter
    entry_id = str(history_counter)
    history_counter += 1
    entry = {
        "_id": entry_id,
        "user_id": user_id,
        "smiles": data.get("smiles"),
        "prediction": data.get("prediction"),
        "toxicity_probability": data.get("toxicity_probability"),
        "iupac_name": data.get("iupac_name"),
        "molecular_formula": data.get("molecular_formula"),
        "features": data.get("features"),
        "molecule_image": data.get("molecule_image"),
        "created_at": datetime.utcnow()
    }
    in_memory_history.append(entry)
    return entry

def get_history_fallback(user_id: str, skip: int = 0, limit: int = 50, search: str = None):
    user_entries = [e for e in in_memory_history if e["user_id"] == user_id]
    if search:
        user_entries = [e for e in user_entries if search.lower() in (e.get("smiles") or "").lower() or search.lower() in (e.get("iupac_name") or "").lower()]
    user_entries.sort(key=lambda x: x["created_at"], reverse=True)
    return user_entries[skip:skip+limit], len(user_entries)

def delete_history_fallback(entry_id: str, user_id: str):
    global in_memory_history
    in_memory_history = [e for e in in_memory_history if e["_id"] != entry_id or e["user_id"] != user_id]
    return True

def delete_all_history_fallback(user_id: str):
    global in_memory_history
    in_memory_history = [e for e in in_memory_history if e["user_id"] != user_id]
    return True

def close_mongo():
    global client
    if client:
        client.close()
