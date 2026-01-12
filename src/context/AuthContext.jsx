import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, getUsuarioActual, eliminarToken } from '../services/api'; 

// 1. Crear el Contexto
const AuthContext = createContext();

// 2. Custom Hook para usar el contexto fácilmente
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Proveedor del Contexto (Aquí se carga y gestiona el estado del usuario/permisos)
export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    // LÓGICA CRUCIAL: Carga el usuario y sus permisos del token al iniciar la aplicación.
    useEffect(() => {
        const cargarUsuarioInicial = () => {
            const user = getUsuarioActual(); 
            setUsuario(user);
            setCargando(false);
        };

        cargarUsuarioInicial();
    }, []);

    // Función de Login que usa tu api.js y actualiza el estado GLOBAL
    const login = async (login, password) => {
        try {
            setCargando(true);
            await apiLogin(login, password); // Llama a tu función de login (guarda el token)
            const user = getUsuarioActual(); // Lee el usuario y permisos recién guardados
            setUsuario(user);
            navigate('/home'); // Redirección exitosa (control centralizado)
            return true;
        } catch (error) {
            setUsuario(null);
            eliminarToken();
            throw error; // Propaga el error para que el componente Login lo muestre
        } finally {
            setCargando(false);
        }
    };

    // Función de Logout
    const logout = () => {
        eliminarToken();
        setUsuario(null);
        navigate('/login');
    };

    /**
     * Verifica si el usuario actual tiene el/los permiso(s) requerido(s).
     * @param {string | string[]} permisosRequeridos - El permiso(s) (ej: 'DISPOSITIVO_LEER' o ['PERMISO_LEER']).
     * @returns {boolean}
     */
    const tienePermiso = (permisosRequeridos) => {
        if (!usuario) return false;

        // 0. NORMALIZACIÓN DE PERMISOS (SOLUCIÓN CLAVE)
        // Esto convierte el string "USUARIO_ADMIN" en ["USUARIO_ADMIN"] si no es ya un array, 
        // evitando errores de .includes en strings que no son arrays.
        let userPermisos = usuario.permisos;
        if (typeof userPermisos === 'string') {
            userPermisos = [userPermisos];
        } else if (!Array.isArray(userPermisos)) {
             // Si la propiedad no existe o no es válida, no tiene permisos.
             return false; 
        }

        // 1. VERIFICACIÓN DE ADMINISTRADOR
        // Si el usuario tiene el rol 'USUARIO_ADMIN' en su lista (ahora normalizada) de permisos, tiene acceso total.
        if (userPermisos.includes("USUARIO_ADMIN")) {
             return true; 
        }

        // 2. Caso: No se requiere ningún permiso específico ([] o null/undefined)
        if (!permisosRequeridos || (Array.isArray(permisosRequeridos) && permisosRequeridos.length === 0)) {
            return true; 
        }
        
        // 3. Coerción de Requeridos: Asegura que siempre trabajemos con un array.
        const required = Array.isArray(permisosRequeridos) ? permisosRequeridos : [permisosRequeridos];

        // 4. Verificación: El usuario debe tener AL MENOS UNO de los permisos requeridos.
        return required.some(permiso => userPermisos.includes(permiso));
    };

    const value = {
        usuario,
        cargando,
        login,
        logout,
        tienePermiso,
    };

    // Muestra un loader mientras se carga el estado inicial del token/permisos
    if (cargando) {
        return <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">Verificando sesión...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};