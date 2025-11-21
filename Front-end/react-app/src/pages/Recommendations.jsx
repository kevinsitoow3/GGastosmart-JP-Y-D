import React, { useState } from "react";
import useRecommendations from "../hooks/useRecommendations";
import RecommendationModal from "../components/RecommendationModal";

// Ajusta si tu API está en otro lugar
const API_BASE = "/api"; 

export default function Recommendations() {
  const [budget, setBudget] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [essential, setEssential] = useState(false);
  const [maxCut, setMaxCut] = useState("");

  const [expenses, setExpenses] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);

  const {
    callRecommendations,
    loading,
    error,
    data
  } = useRecommendations(API_BASE);

  // -------------------------------
  // Añadir gasto
  // -------------------------------
  const addExpense = () => {
    if (!name || !category || !amount) {
      alert("Llena nombre, categoría y monto.");
      return;
    }

    const newExpense = {
      id: crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: name.trim(),
      category: category.trim(),
      amount: Number(parseFloat(amount)),
      essential: !!essential,
      max_cut_fraction: maxCut !== "" ? Number(parseFloat(maxCut)) : undefined
    };

    setExpenses(prev => [...prev, newExpense]);

    // limpiar campos
    setName("");
    setCategory("");
    setAmount("");
    setEssential(false);
    setMaxCut("");
  };

  const removeExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // -------------------------------
  // Llamar a la API
  // -------------------------------
  const handleGenerate = async () => {
    if (budget === "" || isNaN(Number(budget))) {
      alert("Ingresa un presupuesto válido.");
      return;
    }

    if (!expenses.length) {
      alert("Agrega al menos un gasto para analizar.");
      return;
    }

    try {
      await callRecommendations(Number(budget), expenses);
      setModalOpen(true);
    } catch (err) {
      console.error("Error al solicitar recomendaciones:", err);
      alert("Error al solicitar recomendaciones. Mira la consola.");
    }
  };

  // -------------------------------
  // Aplicar recomendaciones → actualizar gastos
  // -------------------------------
  const applyRecommendations = () => {
    if (!data || !data.recommendations) return;

    const recs = data.recommendations;

    const updated = expenses.map(e => {
      const r = recs.find(rr => rr.id === e.id);
      if (r) {
        return {
          ...e,
          amount: Number(r.recommended_amount)
        };
      }
      return e;
    });

    setExpenses(updated);
    setModalOpen(false);
  };

  // -------------------------------

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Recomendaciones de Presupuesto</h1>

      {/* Presupuesto */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Presupuesto total</label>
        <input
          type="number"
          value={budget}
          onChange={e => setBudget(e.target.value)}
          placeholder="Ej. 1000"
          className="mt-1 p-2 border rounded w-full"
        />
      </div>

      {/* Registrar gastos */}
      <section className="mb-6 p-3 border rounded">
        <h2 className="font-medium mb-2">Agregar gasto</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            placeholder="Nombre (Ej. Comidas fuera)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="p-2 border rounded"
          />

          <input
            placeholder="Categoría (Ej. Ocio)"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="p-2 border rounded"
          />

          <input
            placeholder="Monto (Ej. 200)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            type="number"
            className="p-2 border rounded"
          />
        </div>

        <div className="flex items-center gap-3 mt-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={essential}
              onChange={e => setEssential(e.target.checked)}
            />
            Esencial
          </label>

          <input
            placeholder="Max cut (0..1) opcional"
            value={maxCut}
            onChange={e => setMaxCut(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            max="1"
            className="p-2 border rounded w-48"
          />

          <button
            onClick={addExpense}
            className="ml-auto px-3 py-2 bg-green-600 text-white rounded"
          >
            Añadir gasto
          </button>
        </div>
      </section>

      {/* Listado de gastos */}
      <section className="mb-6">
        <h3 className="font-medium mb-2">Gastos actuales</h3>

        {expenses.length === 0 ? (
          <div className="text-sm text-gray-500">No hay gastos añadidos.</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th>Nombre</th>
                <th>Cat.</th>
                <th>Monto</th>
                <th>Esencial</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-b">
                  <td className="py-2">{e.name}</td>
                  <td>{e.category}</td>
                  <td>${Number(e.amount).toFixed(2)}</td>
                  <td>{e.essential ? "Sí" : "No"}</td>
                  <td>
                    <button
                      onClick={() => removeExpense(e.id)}
                      className="text-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Botones finales */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Analizando..." : "Obtener recomendaciones"}
        </button>

        <button
          onClick={applyRecommendations}
          disabled={!data || !data.recommendations}
          className="px-4 py-2 bg-indigo-500 text-white rounded"
        >
          Aplicar recomendaciones
        </button>
      </div>

      {/* Errores */}
      {error && (
        <div className="mt-3 text-red-600">Error: {error.message}</div>
      )}

      {/* Modal */}
      <RecommendationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        recommendationsResponse={data}
      />
    </div>
  );
}
