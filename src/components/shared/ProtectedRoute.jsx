import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, permisoRequerido }) => {
    const { usuario, cargando, tienePermiso } = useAuth();

    // 1. Muestra un estado de carga mientras se verifica la autenticación inicial
    if (cargando) {
        return <div className="flex justify-center items-center h-screen bg-gray-100">Cargando sesión...</div>;
    }

    // 2. Si el usuario no está logueado, redirige al Login
    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    // 3. Verifica si el usuario tiene el permiso necesario (usa la función corregida)
    if (tienePermiso(permisoRequerido)) {
        // Si tiene el permiso o si no se requiere un permiso específico ([]), renderiza el componente hijo
        return children;
    }

    // 4. Si el usuario está logueado pero no tiene el permiso, redirige a No Autorizado
    return <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;