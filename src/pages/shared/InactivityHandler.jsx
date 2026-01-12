import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InactivityHandler = ({ logout }) => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    //const INACTIVITY_TIME = 15 * 60 * 1000; // 15 minutos
    const INACTIVITY_TIME = 30 * 1000; // 15 minutos
    //const WARNING_TIME = 14 * 60 * 1000;    // mostrar aviso al minuto 14
    const WARNING_TIME = 20 * 60 * 1000; 
    let warningTimeout, logoutTimeout;

    const resetTimer = () => {
      clearTimeout(warningTimeout);
      clearTimeout(logoutTimeout);

      warningTimeout = setTimeout(() => {
        setShowWarning(true); // mostrar modal de advertencia
      }, WARNING_TIME);

      logoutTimeout = setTimeout(() => {
        logout();
        navigate('/login');
      }, INACTIVITY_TIME);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(warningTimeout);
      clearTimeout(logoutTimeout);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [logout, navigate]);

  const stayConnected = () => {
    setShowWarning(false);
    // reinicia el temporizador manualmente
    const event = new Event('mousemove');
    window.dispatchEvent(event);
  };

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-lg font-bold">Sesión por expirar</h2>
            <p>Tu sesión se cerrará en 1 minuto por inactividad.</p>
            <div className="mt-4 flex gap-4">
              <button
                onClick={stayConnected}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Continuar conectado
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
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
