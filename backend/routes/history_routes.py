from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId
from typing import List

from database import (
    get_db, is_fallback,
    create_history_fallback, get_history_fallback,
    delete_history_fallback, delete_all_history_fallback
)
from auth import get_current_user, TokenData, HistoryCreate

router = APIRouter(prefix="/history", tags=["History"])

@router.post("", response_model=dict)
async def create_history_entry(
    history_data: HistoryCreate,
    current_user: TokenData = Depends(get_current_user)
):
    try:
        if is_fallback():
            entry = create_history_fallback(current_user.user_id, history_data.dict())
            return {
                "success": True,
                "message": "History entry created",
                "id": entry["_id"]
            }
        else:
            db = get_db()
            if db is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database connection failed"
                )
            
            history_doc = {
                "user_id": current_user.user_id,
                "smiles": history_data.smiles,
                "prediction": history_data.prediction,
                "toxicity_probability": history_data.toxicity_probability,
                "iupac_name": history_data.iupac_name,
                "molecular_formula": history_data.molecular_formula,
                "features": history_data.features,
                "molecule_image": history_data.molecule_image,
                "created_at": datetime.utcnow()
            }
            
            result = db.history.insert_one(history_doc)
            
            return {
                "success": True,
                "message": "History entry created",
                "id": str(result.inserted_id)
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create history: {str(e)}"
        )

@router.get("", response_model=dict)
async def get_history(
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    current_user: TokenData = Depends(get_current_user)
):
    try:
        if is_fallback():
            entries, total = get_history_fallback(current_user.user_id, skip, limit, search)
            return {
                "success": True,
                "entries": [
                    {
                        "id": e["_id"],
                        "smiles": e["smiles"],
                        "prediction": e["prediction"],
                        "toxicity_probability": e.get("toxicity_probability"),
                        "iupac_name": e.get("iupac_name"),
                        "molecular_formula": e.get("molecular_formula"),
                        "features": e.get("features"),
                        "created_at": e["created_at"].isoformat()
                    }
                    for e in entries
                ],
                "total": total,
                "skip": skip,
                "limit": limit
            }
        else:
            db = get_db()
            if db is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database connection failed"
                )
            
            query = {"user_id": current_user.user_id}
            
            if search:
                query["$or"] = [
                    {"smiles": {"$regex": search, "$options": "i"}},
                    {"iupac_name": {"$regex": search, "$options": "i"}}
                ]
            
            total = db.history.count_documents(query)
            
            history_list = list(
                db.history.find(query)
                .sort("created_at", -1)
                .skip(skip)
                .limit(limit)
            )
            
            entries = []
            for entry in history_list:
                entries.append({
                    "id": str(entry["_id"]),
                    "smiles": entry["smiles"],
                    "prediction": entry["prediction"],
                    "toxicity_probability": entry.get("toxicity_probability"),
                    "iupac_name": entry.get("iupac_name"),
                    "molecular_formula": entry.get("molecular_formula"),
                    "features": entry.get("features"),
                    "created_at": entry["created_at"].isoformat()
                })
            
            return {
                "success": True,
                "entries": entries,
                "total": total,
                "skip": skip,
                "limit": limit
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get history: {str(e)}"
        )

@router.get("/{history_id}", response_model=dict)
async def get_history_entry(
    history_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    try:
        if is_fallback():
            entries, _ = get_history_fallback(current_user.user_id, 0, 1000)
            entry = next((e for e in entries if e["_id"] == history_id), None)
            if not entry:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="History entry not found"
                )
            return {
                "success": True,
                "entry": {
                    "id": entry["_id"],
                    "smiles": entry["smiles"],
                    "prediction": entry["prediction"],
                    "toxicity_probability": entry.get("toxicity_probability"),
                    "iupac_name": entry.get("iupac_name"),
                    "molecular_formula": entry.get("molecular_formula"),
                    "features": entry.get("features"),
                    "molecule_image": entry.get("molecule_image"),
                    "created_at": entry["created_at"].isoformat()
                }
            }
        else:
            db = get_db()
            if db is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database connection failed"
                )
            
            try:
                entry = db.history.find_one({
                    "_id": ObjectId(history_id),
                    "user_id": current_user.user_id
                })
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid history ID"
                )
            
            if not entry:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="History entry not found"
                )
            
            return {
                "success": True,
                "entry": {
                    "id": str(entry["_id"]),
                    "smiles": entry["smiles"],
                    "prediction": entry["prediction"],
                    "toxicity_probability": entry.get("toxicity_probability"),
                    "iupac_name": entry.get("iupac_name"),
                    "molecular_formula": entry.get("molecular_formula"),
                    "features": entry.get("features"),
                    "molecule_image": entry.get("molecule_image"),
                    "created_at": entry["created_at"].isoformat()
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get history entry: {str(e)}"
        )

@router.delete("/{history_id}", response_model=dict)
async def delete_history_entry(
    history_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    try:
        if is_fallback():
            delete_history_fallback(history_id, current_user.user_id)
            return {
                "success": True,
                "message": "History entry deleted"
            }
        else:
            db = get_db()
            if db is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database connection failed"
                )
            
            try:
                result = db.history.delete_one({
                    "_id": ObjectId(history_id),
                    "user_id": current_user.user_id
                })
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid history ID"
                )
            
            if result.deleted_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="History entry not found"
                )
            
            return {
                "success": True,
                "message": "History entry deleted"
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete history entry: {str(e)}"
        )

@router.delete("", response_model=dict)
async def delete_all_history(
    current_user: TokenData = Depends(get_current_user)
):
    try:
        if is_fallback():
            delete_all_history_fallback(current_user.user_id)
            return {
                "success": True,
                "message": "All history deleted"
            }
        else:
            db = get_db()
            if db is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database connection failed"
                )
            
            result = db.history.delete_many({"user_id": current_user.user_id})
            
            return {
                "success": True,
                "message": f"Deleted {result.deleted_count} history entries"
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete history: {str(e)}"
        )
