import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BalanceProvider } from "./contexts/BalanceContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import useSessionTimeout from "./hooks/useSessionTimeout";

// ⬇️ IMPORTS NUEVOS
import useRecommendations from "./hooks/useRecommendations";
import RecommendationModal from "./components/RecommendationModal";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import InitialBudget from "./pages/InitialBudget";
import Dashboard from "./pages/Dashboard";
import IncomeExpenses from "./pages/IncomeExpenses";
import Goals from "./pages/Goals";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import PasswordReset from "./pages/PasswordReset";
import VerifyRecoveryCode from "./pages/VerifyRecoveryCode";
import NewPassword from "./pages/NewPassword";
import VerifyRegistrationCode from "./pages/VerifyRegistrationCode";

// ------------------------------------------------
//  APP CONTENT
// ------------------------------------------------
function AppContent() {
  // Timeout global
  useSessionTimeout();

  // Limpieza de sesión previa
  React.useEffect(() => {
    const hasActiveSession =
      sessionStorage.getItem("token") || sessionStorage.getItem("user");

    if (!hasActiveSession) {
      const keysToRemove = ["token", "user", "lastActivity"];
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  }, []);

  // ------------------------------------------------
  // ⬇️ ESTADOS NUEVOS PARA RECOMENDACIONES
  // ------------------------------------------------
  const { callRecommendations, loading, error, data } =
    useRecommendations("/api"); // Ajusta base si tu backend es diferente

  const [modalOpen, setModalOpen] = useState(false);

  // Simulación de budget + expenses → reemplázalos por tus reales
  const [budget, setBudget] = useState(1000);
  const [expenses, setExpenses] = useState([
    { id: "1", name: "Renta", category: "Vivienda", amount: 600, essential: true },
    { id: "2", name: "Comidas fuera", category: "Ocio", amount: 200, essential: false },
    { id: "3", name: "Subscripciones", category: "Hogar", amount: 150, essential: false },
    { id: "4", name: "Transporte", category: "Movilidad", amount: 100, essential: true },
  ]);

  // ------------------------------------------------
  // ⬇️ FUNCIÓN PARA ENVIAR A BACKEND Y ABRIR MODAL
  // ------------------------------------------------
  const handleGetRecommendations = async () => {
    try {
      const payloadExpenses = expenses.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        amount: Number(e.amount),
        essential: !!e.essential,
        max_cut_fraction:
          e.max_cut_fraction !== undefined ? Number(e.max_cut_fraction) : undefined,
      }));

      await callRecommendations(budget, payloadExpenses);
      setModalOpen(true);
    } catch (err) {
      console.error("Error solicitando recomendaciones", err);
      alert("Error solicitando recomendaciones: " + (err.message || err.toString()));
    }
  };

  return (
    <div className="App">
      {/* BOTÓN PARA PROBAR RECOMENDACIONES — LO PUEDES MOVER A OTRA PÁGINA */}
      <div className="p-4">
        <button
          onClick={handleGetRecommendations}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          {loading ? "Analizando..." : "Obtener recomendaciones"}
        </button>

        {error && <p className="text-red-600 mt-2">Error: {error.message}</p>}
      </div>

      {/* MODAL */}
      <RecommendationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        recommendationsResponse={data}
      />

      {/* RUTAS */}
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        <Route
          path="/password-reset"
          element={
            <PublicRoute>
              <PasswordReset />
            </PublicRoute>
          }
        />

        <Route
          path="/verify-recovery-code"
          element={
            <PublicRoute>
              <VerifyRecoveryCode />
            </PublicRoute>
          }
        />

        <Route
          path="/new-password"
          element={
            <PublicRoute>
              <NewPassword />
            </PublicRoute>
          }
        />

        <Route
          path="/verify-registration-code"
          element={
            <PublicRoute>
              <VerifyRegistrationCode />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/initial-budget"
          element={
            <ProtectedRoute>
              <InitialBudget />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/income-expenses"
          element={
            <ProtectedRoute>
              <IncomeExpenses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <Goals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

// ------------------------------------------------
//  WRAPPERS
// ------------------------------------------------
function App() {
  return (
    <AuthProvider>
      <BalanceProvider>
        <AppContent />
      </BalanceProvider>
    </AuthProvider>
  );
}

export default App;
