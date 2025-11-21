# routers/recommendations.py
from typing import List
from fastapi import APIRouter, HTTPException
from datetime import datetime

from models.recommendations import (
    ExpenseIn,
    RecommendationItem,
    RecommendationsOut,
    round2,
)
from models.mongo_recommendations import RecommendationDB, RecommendationEntryDB
from database.recommendations_db import (
    save_recommendations_db,
    get_recommendations_db,
)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


# ------------------------------------------------------------
# ALGORITMO VORAZ
# ------------------------------------------------------------
def greedy_recommendations(budget: float, expenses: List[ExpenseIn]):
    """
    Estrategia voraz:
      - Calcula total de gastos y overspend.
      - Ordena gastos (no esenciales primero, luego por monto descendente).
      - Aplica recortes hasta cubrir overspend usando max_cut_fraction o 50% para no esenciales.
    Retorna: (recommendations_list, total_expenses, overspend)
    """
    total_expenses = sum(e.amount for e in expenses)
    total_expenses = round2(total_expenses)
    overspend = round2(total_expenses - budget)

    if overspend <= 0:
        # No se necesita recorte
        return [], total_expenses, 0.0

    # Ordenar: no esenciales (False) antes de esenciales (True), y por monto grande primero
    # key: (essential, -amount) -> essential=True -> sorts after False
    sorted_expenses = sorted(expenses, key=lambda e: (e.essential, -e.amount))

    remaining_cut = overspend
    recommendations: List[RecommendationItem] = []

    for exp in sorted_expenses:
        original = round2(exp.amount)
        recommended_amount = original
        reduced = 0.0

        if not exp.essential:
            # Máximo recorte permitido
            max_cut_fraction = (
                float(exp.max_cut_fraction) if exp.max_cut_fraction is not None else 0.5
            )
            # clamp fraction between 0 and 1
            max_cut_fraction = max(0.0, min(1.0, max_cut_fraction))
            max_cut_allowed = round2(original * max_cut_fraction)

            cut = min(max_cut_allowed, remaining_cut)
            recommended_amount = round2(original - cut)
            reduced = round2(original - recommended_amount)
            remaining_cut = round2(remaining_cut - reduced)

        # Build RecommendationItem
        reduced_by_percent = round2((reduced / original * 100) if original else 0.0)
        recommendations.append(
            RecommendationItem(
                id=exp.id,
                name=exp.name,
                category=exp.category,
                original_amount=original,
                recommended_amount=recommended_amount,
                reduced_by=reduced,
                reduced_by_percent=reduced_by_percent,
            )
        )

        if remaining_cut <= 0:
            break

    return recommendations, total_expenses, overspend


# ------------------------------------------------------------
# ENDPOINTS
# ------------------------------------------------------------

@router.post("/", response_model=RecommendationsOut)
async def generate_recommendations(budget: float, expenses: List[ExpenseIn]):
    """
    Genera recomendaciones usando algoritmo voraz y (opcionalmente) las guarda en MongoDB.
    - budget: número (presupuesto total)
    - expenses: lista de ExpenseIn
    """
    if budget is None or budget < 0:
        raise HTTPException(status_code=400, detail="El presupuesto debe ser un número no negativo.")

    # 1) Ejecutar algoritmo voraz
    recommendations, total_expenses, overspend = greedy_recommendations(budget, expenses)

    # 2) Construir respuesta para frontend
    response = RecommendationsOut(
        total_budget=round2(budget),
        total_expenses=round2(total_expenses),
        overspend=round2(overspend),
        recommendations=recommendations,
        message="Recomendaciones generadas con algoritmo voraz."
    )

    # 3) Guardar en la base de datos (opcional: ajustar user_id cuando tengas auth)
    try:
        db_payload = {
            "budget": round2(budget),
            "total_expenses": round2(total_expenses),
            "overspend": round2(overspend),
            "recommendations": [r.dict() for r in recommendations],
            "message": response.message,
        }

        # user_id: reemplaza "test-user" por el user real cuando integres auth
        await save_recommendations_db("test-user", db_payload)
    except Exception:
        # No bloquear la respuesta al frontend si falla el guardado; loguea si quieres.
        # Puedes decidir lanzar error en vez de silenciarlo según tu política.
        pass

    # 4) Retornar la respuesta
    return response


@router.get("/{user_id}")
async def load_saved_recommendations(user_id: str, limit: int = 50):
    """
    Recupera recomendaciones guardadas para un user_id (hasta `limit` registros).
    """
    docs = await get_recommendations_db(user_id, limit=limit)
    if not docs:
        raise HTTPException(status_code=404, detail="No hay recomendaciones guardadas para el usuario.")
    return docs


@router.post("/save/{user_id}")
async def save_recommendations(user_id: str, payload: RecommendationsOut):
    """
    Guardar manualmente un RecommendationsOut (útil si el frontend quiere confirmar y luego guardar).
    """
    payload_dict = {
        "budget": payload.total_budget,
        "total_expenses": payload.total_expenses,
        "overspend": payload.overspend,
        "recommendations": [r.dict() for r in payload.recommendations],
        "message": payload.message or "guardado manualmente",
    }
    inserted_id = await save_recommendations_db(user_id, payload_dict)
    return {"status": "ok", "id": inserted_id, "message": "Recomendaciones guardadas correctamente."}
