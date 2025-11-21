// src/pages/BudgetPage.jsx
import React, { useState } from "react";
import useRecommendations from "../hooks/useRecommendations";
import RecommendationModal from "../components/RecommendationModal";

export default function BudgetPage() {

  // ESTADOS DE EJEMPLO (reemplaza luego con tu estado real)
  const [budget, setBudget] = useState(1000);

  const [expenses, setExpenses] = useState([
    { id: "1", name: "Renta", category: "Vivienda", amount: 600, essential: true },
    { id: "2", name: "Comidas fuera", category: "Ocio", amount: 200, essential: false },
    { id: "3", name: "Subscripciones", category: "Hogar", amount: 150, essential: false },
    { id: "4", name: "Transporte", category: "Movilidad", amount: 100, essential: true },
  ]);

  const { callRecommendations, loading, error, data } =
    useRecommendations("/api");

  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = async () => {
    try {
      const payloadExpenses = expenses.map(e => ({
        id: e.id,
        name: e.name,
        category: e.category,
        amount: Number(e.amount),
        essential: !!e.essential,
        max_cut_fraction: e.max_cut_fraction !== undefined
          ? Number(e.max_cut_fraction)
          : undefined,
      }));

      await callRecommendations(budget, payloadExpenses);
      setModalOpen(true);

    } catch (err) {
      console.error("Fallo al pedir recomendaciones", err);
      alert("Error al solicitar recomendaciones: " + (err.message || err.toString()));
    }
  };

  return (
    <div className="p-4">

      {/* BOTÓN PARA OBTENER RECOMENDACIONES */}
      <div className="mt-4">
        <button
          onClick={handleClick}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Analizando..." : "Obtener recomendaciones"}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-red-600">
          Error: {error.message}
        </div>
      )}

      {/* MODAL DE RECOMENDACIONES */}
      <RecommendationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        recommendationsResponse={data}
      />
    </div>
  );
}
