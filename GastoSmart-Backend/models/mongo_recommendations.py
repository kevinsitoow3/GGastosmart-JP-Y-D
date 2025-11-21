# models/mongo_recommendations.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RecommendationEntryDB(BaseModel):
    expense_id: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    original_amount: float
    recommended_amount: float
    reduced_by: float
    reduced_by_percent: float

class RecommendationDB(BaseModel):
    user_id: Optional[str] = None
    budget: float
    total_expenses: float
    overspend: float
    recommendations: List[RecommendationEntryDB]
    created_at: datetime = datetime.utcnow()
