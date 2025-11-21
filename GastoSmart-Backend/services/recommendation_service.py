# services/recommendation_service.py
from database.mongo import recommendations_collection
from models.mongo_recommendations import RecommendationDB
from datetime import datetime

async def save_recommendation_to_db(rec: RecommendationDB):
    data = rec.dict()
    data["created_at"] = datetime.utcnow()
    
    result = await recommendations_collection.insert_one(data)
    return str(result.inserted_id)
