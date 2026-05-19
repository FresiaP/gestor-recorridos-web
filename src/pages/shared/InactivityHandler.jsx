import { useCallback } from "react";
import { useSessionTimeout } from "../../hooks/useSessionTimeout";

const InactivityHandler = ({ logout }) => {
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const { showWarning, remainingSeconds, continueSession } = useSessionTimeout({
    enabled: true,
    onTimeout: handleLogout,
    onExtendSession: async () => {},
    inactivityMs: 15 * 60 * 1000,
    warningMs: 60 * 1000,
  });

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-lg font-bold">Sesión por expirar</h2>
            <p>
              Tu sesión se cerrará en {remainingSeconds} segundos por
              inactividad.
            </p>
            <div className="mt-4 flex gap-4">
              <button
                onClick={continueSession}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Continuar conectado
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Cerrar sesión ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InactivityHandler;
