// src/components/layout/DashboardLayout.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom'; //para la redirección al logout
import { eliminarToken, getUsuarioActual } from '../../services/api';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

// CONFIGURACIÓN DE TIEMPOS DE INACTIVIDAD (en milisegundos)
// Tiempo estándar de la industria para inactividad es 15 minutos (900,000 ms).
const INACTIVITY_TIME = 900000; // 15 minutos (900,000 ms)
const WARNING_TIME = 5000;     // 5 segundos de aviso antes de cerrar sesión forzado

const DashboardLayout = ({ children, pageTitle, activePath }) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [usuario, setUsuario] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const toggleMenu = () => setIsMenuOpen(prev => !prev);

    // Referencias para manejar los timers
    const inactivityTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    // Referencia para el estado del modal, para ser usada en el event listener
    const showTimeoutModalRef = useRef(showTimeoutModal);

    // Sincronizar la referencia con el estado cada vez que cambia
    useEffect(() => {
        showTimeoutModalRef.current = showTimeoutModal;
    }, [showTimeoutModal]);


    // Función de logout que elimina el token y redirige.
    const handleLogout = useCallback(() => {
        eliminarToken();
        // Limpiamos los timers por si acaso
        clearTimeout(inactivityTimerRef.current);
        clearTimeout(warningTimerRef.current);
        // Redirigimos al login
        navigate('/login');
    }, [navigate]);

    // --------------------------------------------------
    // LÓGICA DE TIEMPO DE ESPERA
    // --------------------------------------------------

    // Función para iniciar la cuenta regresiva de aviso
    const startWarning = useCallback(() => {
        // Detenemos el timer principal
        clearTimeout(inactivityTimerRef.current);

        setShowTimeoutModal(true); // Mostramos el modal de advertencia

        // Configuramos el timer final: si no responde en WARNING_TIME, cierra sesión
        warningTimerRef.current = setTimeout(() => {
            handleLogout();
        }, WARNING_TIME);
    }, [handleLogout]);

    // Función principal para resetear la inactividad
    const resetTimeout = useCallback(() => {
        // Limpiamos los dos timers
        clearTimeout(warningTimerRef.current);
        clearTimeout(inactivityTimerRef.current);

        // Aseguramos que el modal esté oculto si el usuario interactúa
        if (showTimeoutModalRef.current) {
            setShowTimeoutModal(false);
        }

        // Configuramos el nuevo timer: llama a startWarning después de INACTIVITY_TIME
        inactivityTimerRef.current = setTimeout(startWarning, INACTIVITY_TIME);
    }, [startWarning]);

    // Función para manejar el "Sí, quiero continuar" del modal
    const handleContinueSession = () => {
        setShowTimeoutModal(false);
        clearTimeout(warningTimerRef.current); // Detenemos el timer de logout
        resetTimeout(); // Reiniciamos el ciclo de inactividad
    };

    // --------------------------------------------------
    // EFECTOS DE CONTROL DE SESIÓN
    // --------------------------------------------------

    useEffect(() => {
        // 1. Carga inicial del usuario
        const user = getUsuarioActual();
        if (!user) {
            setUsuario(null);
            setIsLoading(false);
            return;
        }

        setUsuario(user);
        setIsLoading(false);

        const events = ['mousemove', 'keypress', 'scroll', 'click'];

        // Handler que usa el Ref para verificar el estado del modal antes de resetear
        const handleUserActivity = () => {
            // Solo reseteamos el timeout si NO estamos en la ventana de advertencia.
            // Esto detiene el "flash" y previene la cancelación del logout forzado.
            if (!showTimeoutModalRef.current) {
                resetTimeout();
            }
        };

        // Iniciamos el timer la primera vez
        resetTimeout();

        // Agregamos listeners
        events.forEach(event => window.addEventListener(event, handleUserActivity));

        // Limpieza de listeners y timers al desmontar
        return () => {
            events.forEach(event => window.removeEventListener(event, handleUserActivity));
            clearTimeout(inactivityTimerRef.current);
            clearTimeout(warningTimerRef.current);
        };

        // Dependencias: resetTimeout es estable.
    }, [resetTimeout]);


    // --------------------------------------------------
    // RENDERIZADO
    // --------------------------------------------------

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-600 text-lg">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Modal de Advertencia de Inactividad (Diseño sencillo con Tailwind) */}
            {showTimeoutModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
                        <h3 className="text-2xl font-bold text-red-600 mb-4">¡Advertencia de Sesión!</h3>
                        <p className="text-gray-700 mb-6">
                            Tu sesión está a punto de cerrarse por inactividad. ¿Deseas continuar?
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={handleContinueSession}
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
                            La sesión se cerrará automáticamente en {WARNING_TIME / 5000} segundos si no respondes.
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
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isMenuOpen ? "lg:pl-64" : "lg:pl-16"}`}>
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