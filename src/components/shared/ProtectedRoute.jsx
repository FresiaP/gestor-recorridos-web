// src/components/shared/ProtectedRoute.jsx (CORREGIDO)
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUsuarioActual } from '../../services/api';

const ProtectedRoute = ({ children, permisoRequerido }) => {
    const usuario = getUsuarioActual();

    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    if (permisoRequerido) {

        // 1. BYPASS para ADMINISTRADORES
        if (usuario.rol === "USUARIO_ADMIN") {
            return children;
        }

        //  2. VERIFICACIÓN FINAL: Compara la cadena requerida con el array de cadenas 
        // ¡No se necesita Number()! Ambos son cadenas de texto.
        if (!usuario.permisos || !usuario.permisos.includes(Number(permisoRequerido))) {
            // Redirección si la comprobación falla
            return <Navigate to="/unauthorized" replace />;
        }

    }

    return children;
};

export default ProtectedRoute;