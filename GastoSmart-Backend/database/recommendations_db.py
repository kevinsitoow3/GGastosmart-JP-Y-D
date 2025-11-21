# database/recommendations_db.py
from typing import List, Dict, Any
from datetime import datetime
from bson import ObjectId
from database.mongo import recommendations_collection

# Helper para convertir ObjectId a string en resultados
def _normalize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc
    doc = dict(doc)
    _id = doc.pop("_id", None)
    if _id is not None:
        doc["id"] = str(_id)
    return doc

async def save_recommendations_db(user_id: str, payload: Dict[str, Any]) -> str:
    """
    Guarda un documento de recomendación en la colección `recommendations`.
    payload: dict que viene del router (RecommendationsOut.dict()).
    Retorna el id insertado como str.
    """
    doc = dict(payload)  # copia segura
    doc["user_id"] = user_id
    doc["created_at"] = datetime.utcnow()
    result = await recommendations_collection.insert_one(doc)
    return str(result.inserted_id)

async def get_recommendations_db(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Recupera hasta `limit` recomendaciones para el user_id ordenadas por created_at desc.
    Devuelve lista de dicts JSON-serializables (ObjectId convertido a string).
    """
    cursor = recommendations_collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    normalized = [_normalize_doc(d) for d in docs]
    return normalized
