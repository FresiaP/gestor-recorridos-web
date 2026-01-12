import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
// Importación del logo de la compañía
import PescanovaLogo from '../../images/pescanova_logo.png'; 

const Login = () => {
    const [loginUser, setLoginUser] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        
        try {
            await login(loginUser, password);
        } catch (err) {
            // El error es un objeto, intenta leer su mensaje si existe
            setError(err.message || "Credenciales inválidas o error de red.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-4">
            
            {/* ENCABEZADO EXTERNO (MARCA DE LA APLICACIÓN) */}
            <div className="mb-8 text-center">
                {/* Icono de Antena/Red/Gráfico en azul */}
                <div className="flex items-center justify-center space-x-2 mb-2 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-4xl">
                        <line x1="12" y1="20" x2="12" y2="10"></line>
                        <line x1="18" y1="20" x2="18" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="16"></line>
                    </svg>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                        IT Assets
                    </h1>
                </div>
                <p className="text-gray-500 text-sm">Sistema de Gestión de Infraestructura</p>
            </div>

            {/* Formulario de Login (EL CUADRO BLANCO) */}
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
                
                {/* LOGO DE LA COMPAÑÍA (DENTRO DEL CUADRO Y ARRIBA) */}
                <div className="flex justify-center mb-6 border-b pb-4">
                    <img 
                        src={PescanovaLogo} 
                        alt="Logo de Pescanova" 
                        // Tamaño ajustado para dentro del card
                        className="h-16 w-auto" 
                    />
                </div>

                {/* TÍTULO INTERNO ("Acceso Requerido") */}
                <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800 flex items-center justify-center space-x-2">
                    {/* Icono de Llave */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline h-6 w-6 text-indigo-500">
                        <path d="M12.5 15.5l5.5-5.5a4.5 4.5 0 0 0-6.3-6.3l-5.5 5.5"></path>
                        <path d="M15 17l-5.5-5.5"></path>
                        <path d="M6.5 15.5l5.5-5.5"></path>
                        <path d="M8 8l5.5 5.5"></path>
                        <path d="M19 14l-5.5-5.5"></path>
                    </svg>
                    <span>Acceso Requerido</span>
                </h2>
                
                <form onSubmit={handleSubmit}>
                    {/* Mensaje de Error */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm" role="alert">
                            {error}
                        </div>
                    )}
                    
                    {/* Campo de Usuario */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="loginUser">
                            Usuario:
                        </label>
                        <input
                            id="loginUser"
                            type="text"
                            value={loginUser}
                            onChange={(e) => setLoginUser(e.target.value)}
                            required
                            disabled={submitting}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out disabled:bg-gray-50"
                            placeholder="Introduce tu usuario"
                        />
                    </div>
                    
                    {/* Campo de Contraseña */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                            Contraseña:
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={submitting}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out disabled:bg-gray-50"
                            placeholder="Introduce tu contraseña"
                        />
                    </div>
                    
                    {/* Botón de Login */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out transform hover:scale-[1.01] disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;