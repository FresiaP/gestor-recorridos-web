import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import LogoImage from "../../images/pescanova_logo.png";
import { menuConfig } from "../../utils/menuConfig";
import { ADMIN_PERM_NAME } from "../../utils/permisosMap";
import { iconMap } from "../ui/Icons"; // íconos centralizados

// Agrupación por secciones y ordenadas
const secciones = {
    Dashboard: ['/home'],
    Infraestructura: [
        "/infraestructura/categorias",
        "/infraestructura/marcas",
        "/infraestructura/tipos",
        "/infraestructura/proveedores",
        "/infraestructura/sitios",
        "/infraestructura/contratos",
        "/infraestructura/modelos",
        "/infraestructura/ubicaciones",
        "/infraestructura/dispositivos",
        "/infraestructura/otrosdispositivo",
    ],
    Recorridos: [
        "/recorridos/consumibles",
        "/recorridos/consumos",
        "/recorridos/parametros",
    ],
    Incidencias: [
        "/incidencia/incidencias",
        "/incidencia/resoluciones",
        "/incidencia/estadodispositivo",
    ],
    Usuarios: ["/usuarios", "/usuarios/permisos", "/usuarios/asignacion"],
    Auditoría: ["/auditoria"],
    Reportes: ["/reportes/reporteconsumo", "/reportes/vencimientocontratos"],
};

const Sidebar = ({ isMenuOpen, handleMenuClose, activePath, usuario }) => {
    const [seccionAbierta, setSeccionAbierta] = useState(null);

    const toggleSeccion = (seccion) => {
        setSeccionAbierta(seccionAbierta === seccion ? null : seccion);
    };

    // Filtrado central: si es admin ve todo, si no, solo lo que tiene permiso
    const menuFiltrado = useMemo(() => {
        const userPermissions = usuario?.permisos || [];
        const isAdmin = userPermissions.includes(ADMIN_PERM_NAME);
        return isAdmin
            ? menuConfig
            : menuConfig.filter((item) => userPermissions.includes(item.permiso));
    }, [usuario]);

    return (
        <aside
            className={`
        fixed top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 z-30 
        lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${isMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-center border-b border-gray-800 bg-white shadow-md">
                <img
                    src={LogoImage}
                    alt="Logo Gestor de Recorridos"
                    className="h-16 w-auto object-contain"
                />
            </div>

            {/* Navegación */}
            <nav className="mt-6 px-4 overflow-y-auto" style={{ height: "calc(100vh - 4rem)" }}>
                {Object.entries(secciones).map(([seccion, rutas]) => {
                    // Filtrar ítems de esta sección según permisos
                    const items = menuFiltrado.filter((item) => rutas.includes(item.path));
                    if (items.length === 0) return null;

                    const isOpen = seccionAbierta === seccion;
                    const HeaderIcon = iconMap[rutas[0]] || iconMap["/home"];

                    return (
                        <div key={seccion} className="mb-2">
                            {/* Encabezado de sección */}
                            <button
                                onClick={() => toggleSeccion(seccion)}
                                aria-expanded={isOpen}
                                aria-label={`Abrir sección ${seccion}`}
                                className={`w-full flex items-center p-3 rounded-lg transition duration-200 justify-between 
                  ${isOpen
                                        ? "bg-gray-700 text-white font-semibold"
                                        : "text-gray-300 hover:bg-gray-700 hover:text-white"}
                `}
                            >
                                <div className="flex items-center">
                                    <HeaderIcon className="h-5 w-5 mr-3" />
                                    <span className="text-sm font-medium">{seccion}</span>
                                </div>
                                <svg
                                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""
                                        }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* Submenús */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                                    }`}
                            >
                                {items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end
                                        className={({ isActive }) =>
                                            `flex items-center pl-8 pr-3 py-2 text-sm rounded-lg transition duration-200 
                      ${isActive
                                                ? "bg-blue-600 text-white font-semibold"
                                                : "text-gray-400 hover:bg-gray-800 hover:text-white"}`
                                        }
                                        onClick={handleMenuClose}
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
