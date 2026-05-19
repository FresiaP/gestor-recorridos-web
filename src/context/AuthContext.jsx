// src/context/AuthContext.js
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  getToken,
  login as apiLogin,
  eliminarToken,
  getUsuarioActual,
} from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  //Carga inicial de usuario
  useEffect(() => {
    const token = getToken();
    if (token) {
      const user = getUsuarioActual();
      if (user) {
        setUsuario(user);
      } else {
        eliminarToken();
        setUsuario(null);
      }
    } else {
      setUsuario(null);
    }
    setCargando(false);
  }, []);

  // Login
  const login = useCallback(
    async (loginUser, password) => {
      try {
        setCargando(true);
        await apiLogin(loginUser, password);

        const user = getUsuarioActual();

        if (user) {
          setUsuario(user);
          navigate("/home", { replace: true });
          return true;
        }

        eliminarToken();
        setUsuario(null);
        throw new Error("Token inválido o sin roles");
      } catch (error) {
        setUsuario(null);
        eliminarToken();
        throw error;
      } finally {
        setCargando(false);
      }
    },
    [navigate],
  );

  const logout = useCallback(() => {
    eliminarToken();
    setUsuario(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const refreshUser = useCallback(() => {
    const user = getUsuarioActual();
    setUsuario(user);
    return user;
  }, []);

  const tienePermiso = useCallback(
    (permisosRequeridos) => {
      if (!usuario) return false;
      let userPermisos = usuario.permisos || [];
      userPermisos = userPermisos.map((p) => String(p).trim().toUpperCase());
      if (userPermisos.includes("USUARIO_ADMIN")) return true;
      if (
        !permisosRequeridos ||
        (Array.isArray(permisosRequeridos) && permisosRequeridos.length === 0)
      )
        return true;
      const required = Array.isArray(permisosRequeridos)
        ? permisosRequeridos
        : [permisosRequeridos];
      return required.some((r) =>
        userPermisos.includes(String(r).trim().toUpperCase()),
      );
    },
    [usuario],
  );

  const value = useMemo(
    () => ({ usuario, cargando, login, logout, refreshUser, tienePermiso }),
    [usuario, cargando, login, logout, refreshUser, tienePermiso],
  );

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">
        Verificando sesión...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
