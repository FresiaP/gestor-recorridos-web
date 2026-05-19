// src/components/layout/DashboardLayout.jsx
import { useCallback, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSessionTimeout } from "../../hooks/useSessionTimeout";
import { refreshSession } from "../../services/api";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

// CONFIGURACIÓN DE TIEMPOS DE INACTIVIDAD (en milisegundos)
// Tiempo estándar de la industria para inactividad es 15 minutos (900,000 ms).
//const INACTIVITY_TIME = 60000; // 1 minuto (60,000 ms)
const INACTIVITY_TIME = 900000; // 15 minutos (900,000 ms)
const WARNING_TIME = 5000; // 5 segundos de aviso antes de cerrar sesión forzado

const DashboardLayout = ({ children, pageTitle, activePath }) => {
  const { usuario, cargando, logout, refreshUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleContinueSession = useCallback(async () => {
    await refreshSession();
    refreshUser();
  }, [refreshUser]);

  const { showWarning, remainingSeconds, continueSession } = useSessionTimeout({
    enabled: Boolean(usuario),
    onTimeout: handleLogout,
    onExtendSession: handleContinueSession,
    inactivityMs: INACTIVITY_TIME,
    warningMs: WARNING_TIME,
  });

  // --------------------------------------------------
  // RENDERIZADO
  // --------------------------------------------------

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Modal de Advertencia de Inactividad (Diseño sencillo con Tailwind) */}
      {showWarning && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <h3 className="text-2xl font-bold text-red-600 mb-4">
              ¡Advertencia de Sesión!
            </h3>
            <p className="text-gray-700 mb-6">
              Tu sesión está a punto de cerrarse por inactividad. ¿Deseas
              continuar?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={continueSession}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 shadow-md"
              >
                Sí, continuar
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition duration-150 shadow-md"
              >
                Cerrar sesión ahora
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              La sesión se cerrará automáticamente en {remainingSeconds}{" "}
              segundos si no respondes.
            </p>
          </div>
        </div>
      )}

      {/* Sidebar (Menú Lateral) */}
      <Sidebar
        isMenuOpen={isMenuOpen}
        toggleMenu={toggleMenu}
        activePath={activePath}
        usuario={usuario}
      />

      {/* Contenido Principal */}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isMenuOpen ? "lg:pl-64" : "lg:pl-16"}`}
      >
        {/* Navbar (Cabecera Superior) */}
        <Navbar
          setIsMenuOpen={setIsMenuOpen}
          pageTitle={pageTitle}
          usuario={usuario}
          onLogout={handleLogout} // Se pasa la función de logout al Navbar
          isMenuOpen={isMenuOpen}
        />

        {/* Área de Contenido */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto pt-24 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
