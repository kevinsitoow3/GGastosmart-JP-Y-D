# database/mongo.py
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "gastosmart")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Colecciones usadas por el servicio de recomendaciones
recommendations_collection = db["recommendations"]
