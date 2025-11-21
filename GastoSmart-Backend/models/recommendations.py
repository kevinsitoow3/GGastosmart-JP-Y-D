# models/recommendations.py

from typing import Optional, List
from pydantic import BaseModel, Field
from decimal import Decimal, ROUND_HALF_UP

# Función para redondear siempre a 2 decimales (muy útil en presupuesto)
def round2(x: float) -> float:
    return float(Decimal(x).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


class ExpenseIn(BaseModel):
    """
    Representa un gasto individual enviado desde el frontend.
    Campos:
    - essential: indica si es un gasto necesario (afecta cuánto podemos recortar)
    - max_cut_fraction: si el frontend quiere limitar cuánto recortar (0..1)
    """
    id: Optional[str] = None
    category: Optional[str] = None
    name: Optional[str] = None
    amount: float = Field(..., gt=0)
    essential: Optional[bool] = False
    max_cut_fraction: Optional[float] = None


class RecommendationItem(BaseModel):
    """
    Resultado para cada gasto después del análisis voraz.
    - original_amount: antes del recorte
    - recommended_amount: nuevo valor recomendado
    - reduced_by: cuanto se recortó en dinero
    - reduced_by_percent: % del recorte
    """
    id: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None

    original_amount: float
    recommended_amount: float
    reduced_by: float
    reduced_by_percent: float


class RecommendationsOut(BaseModel):
    """
    Respuesta completa del backend hacia el frontend.
    Incluye totales, recorte calculado y una lista de recomendaciones.
    """
    total_budget: float
    total_expenses: float
    overspend: float
    recommendations: List[RecommendationItem]
    message: Optional[str] = None
