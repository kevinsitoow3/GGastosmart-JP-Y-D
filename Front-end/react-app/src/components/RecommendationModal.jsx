// src/components/RecommendationModal.jsx
import React from "react";

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - recommendationsResponse: object (respuesta del backend)
 * - onApply: optional () => void  -> si se pasa, el botón "Aplicar recomendaciones" lo llamará
 */
export default function RecommendationModal({
  open,
  onClose,
  recommendationsResponse,
  onApply,
}) {
  if (!open) return null;

  const {
    total_budget,
    total_expenses,
    overspend,
    recommendations = [],
    message,
  } = recommendationsResponse || {};

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[85vh] overflow-auto">
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Recomendaciones</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </header>

        <main className="p-4">
          <div className="mb-3 text-sm text-gray-700 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div><strong>Presupuesto:</strong> ${Number(total_budget ?? 0).toFixed(2)}</div>
            <div><strong>Gastos totales:</strong> ${Number(total_expenses ?? 0).toFixed(2)}</div>
            <div><strong>Exceso:</strong> ${Number(overspend ?? 0).toFixed(2)}</div>
          </div>

          {message && (
            <div className="mb-3 text-sm text-gray-600 italic">{message}</div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Gasto</th>
                  <th className="py-2">Categoría</th>
                  <th className="py-2">Original</th>
                  <th className="py-2">Recomendado</th>
                  <th className="py-2">Reducido</th>
                  <th className="py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-500">
                      No hay recomendaciones (estás dentro del presupuesto o no hay datos).
                    </td>
                  </tr>
                ) : (
                  recommendations.map((r, idx) => (
                    <tr key={r.id ?? idx} className="border-b">
                      <td className="py-2">{r.name ?? "—"}</td>
                      <td>{r.category ?? "—"}</td>
                      <td>${Number(r.original_amount ?? 0).toFixed(2)}</td>
                      <td>${Number(r.recommended_amount ?? 0).toFixed(2)}</td>
                      <td>${Number(r.reduced_by ?? 0).toFixed(2)}</td>
                      <td>{Number(r.reduced_by_percent ?? 0).toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>

        <footer className="flex items-center justify-end gap-3 px-4 py-3 border-t">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Cerrar
          </button>

          <button
            onClick={() => onApply && onApply()}
            disabled={!recommendations || recommendations.length === 0}
            className={`px-3 py-2 rounded text-white ${
              recommendations && recommendations.length > 0
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-indigo-300 cursor-not-allowed"
            }`}
          >
            Aplicar recomendaciones
          </button>
        </footer>
      </div>
    </div>
  );
}
