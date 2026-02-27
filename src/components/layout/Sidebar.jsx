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
        "/infraestructura/activos",
        "/infraestructura/servicios",
        "/infraestructura/dispositivos",
        "/infraestructura/otrosdispositivo",
    ],
    Recorridos: [
        "/recorridos/consumibles",
        "/recorridos/consumos",
        "/recorridos/consumosMensuales",
        "/recorridos/parametros",
    ],
    Incidencias: [
        "/incidencia/incidencias",
        "/incidencia/resoluciones",
    ],
    Usuarios: ["/usuarios", "/usuarios/permisos", "/usuarios/asignacion"],
    Auditoría: ["/auditoria"],
    Reportes: ["/reportes/vencimientocontratos"],
};

const Sidebar = ({ isMenuOpen, toggleMenu, activePath, usuario }) => {
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
            className={` fixed top-0 left-0 h-screen bg-slate-900 text-slate-300 z-30 transition-all duration-300 ease-in-out ${isMenuOpen ? "w-64" : "w-16"} `} >
            {/* Logo + Botón colapsar */}
            <div className="h-16 flex items-center justify-between border-b border-gray-800 bg-white shadow-md px-2">
                <img
                    src={LogoImage}
                    alt="Logo Gestor de Recorridos"
                    className={`object-contain transition-all duration-300 ${isMenuOpen ? "h-16 w-auto" : "h-10 w-10"}`}
                />

                <button
                    onClick={toggleMenu}
                    className="bg-gray-700 text-white p-1 rounded-full hover:bg-gray-600"
                    aria-label={isMenuOpen ? "Colapsar menú" : "Expandir menú"}
                >
                    {isMenuOpen ? "«" : "»"}
                </button>
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
                                    {isMenuOpen && <span className="text-sm font-medium">{seccion}</span>}
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
                            {isMenuOpen && (
                                <div
                                    className={`overflow-y-auto transition-all duration-300 ease-in-out 
    ${isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}`}
                                    role="menu"
                                    aria-orientation="vertical"
                                    onKeyDown={(e) => {
                                        const focusableItems = e.currentTarget.querySelectorAll("a");
                                        const currentIndex = Array.from(focusableItems).indexOf(document.activeElement);

                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            const next = focusableItems[currentIndex + 1] || focusableItems[0];
                                            next.focus();
                                        }
                                        if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            const prev = focusableItems[currentIndex - 1] || focusableItems[focusableItems.length - 1];
                                            prev.focus();
                                        }
                                    }}
                                >
                                    {items.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            role="menuitem"
                                            end
                                            className={({ isActive }) =>
                                                `flex items-center pl-8 pr-3 py-2 text-sm rounded-lg transition duration-200 
      ${isActive
                                                    ? "bg-blue-600 text-white font-semibold"
                                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"}`
                                            }
                                        >
                                            {item.label}
                                        </NavLink>
                                    ))}

                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
