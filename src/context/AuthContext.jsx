// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, eliminarToken, getUsuarioActual } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    //Carga inicial de usuario
    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (token) {
            const user = getUsuarioActual();
            if (user) {
                setUsuario(user);
            } else {
                eliminarToken();
                setUsuario(null);
            }
        } else {
            console.log("No hay token en sessionStorage");
            setUsuario(null);
        }
        setCargando(false);
    }, []);

    // Login
    const login = async (loginUser, password) => {
        try {
            setCargando(true);
            await apiLogin(loginUser, password);

            const user = getUsuarioActual();
            console.log("Usuario después de login:", user);

            if (user) {
                setUsuario(user);
                navigate("/home"); // redirige al dashboard
                return true;
            } else {
                // Si el token es inválido o no trae roles válidos
                eliminarToken();
                setUsuario(null);
                throw new Error("Token inválido o sin roles");
            }
        } catch (error) {
            setUsuario(null);
            eliminarToken();
            throw error;
        } finally {
            setCargando(false);
        }
    };


    const logout = () => {
        eliminarToken();
        setUsuario(null);
        navigate("/login");
    };

    const tienePermiso = (permisosRequeridos) => {
        if (!usuario) return false;
        let userPermisos = usuario.permisos || [];
        userPermisos = userPermisos.map(p => String(p).trim().toUpperCase());
        if (userPermisos.includes("USUARIO_ADMIN")) return true;
        if (!permisosRequeridos || (Array.isArray(permisosRequeridos) && permisosRequeridos.length === 0)) return true;
        const required = Array.isArray(permisosRequeridos) ? permisosRequeridos : [permisosRequeridos];
        return required.some(r => userPermisos.includes(String(r).trim().toUpperCase()));
    };

    const value = { usuario, cargando, login, logout, tienePermiso };

    if (cargando) {
        return <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">Verificando sesión...</div>;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
