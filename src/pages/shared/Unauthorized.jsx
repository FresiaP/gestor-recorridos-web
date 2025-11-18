// src/pages/shared/Unauthorized.jsx
import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
                {/* Ícono de advertencia */}
                <div className="flex justify-center mb-4">
                    <svg
                        className="w-16 h-16 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
                        />
                    </svg>
                </div>

                {/* Mensaje principal */}
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Acceso denegado
                </h1>
                <p className="text-gray-600 mb-6">
                    No tienes permiso para acceder a esta sección.
                    Si crees que esto es un error, contacta al administrador del sistema.
                </p>

                {/* Botón para volver */}
                <Link
                    to="/home"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                >
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;
