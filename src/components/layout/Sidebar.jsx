import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
//import LogoImage from '../../images/logo.png';
import LogoImage from '../../images/pescanova_logo.png';

// Configuración de Menú 
const menuConfig = [
    // 1. Dashboard (Se mantendra fijo)
    { label: 'Dashboard', path: '/home', permiso: 'USUARIO_LEER' },

    // 2. Infraestructura (Orden solicitado)
    { label: 'Categorías', path: '/infraestructura/categorias', permiso: 'CATEGORIA_LEER' },
    { label: 'Marcas', path: '/infraestructura/marcas', permiso: 'MARCA_LEER' },
    { label: 'Proveedores', path: '/infraestructura/proveedores', permiso: 'PROVEEDOR_LEER' },
    { label: 'Sitios', path: '/infraestructura/sitios', permiso: 'SITIO_LEER' },
    { label: 'Contratos', path: '/infraestructura/contratos', permiso: 'CONTRATO_LEER' },
    { label: 'Modelos', path: '/infraestructura/modelos', permiso: 'MODELO_LEER' },
    { label: 'Ubicaciones', path: '/infraestructura/ubicaciones', permiso: 'UBICACION_LEER' },
    { label: 'Dispositivos', path: '/infraestructura/dispositivos', permiso: 'DISPOSITIVO_LEER' },
    { label: 'Otros Dispositivos', path: '/infraestructura/otros-dispositivos', permiso: 'OTROSDISPOSITIVO_LEER' },

    // 3. Recorridos
    { label: 'Consumibles', path: '/recorridos/consumibles', permiso: 'CONSUMIBLE_LEER' },
    { label: 'Consumos', path: '/recorridos/consumos', permiso: 'CONSUMO_LEER' },
    { label: 'Parámetros Ambiente', path: '/recorridos/parametros', permiso: 'PARAMETROAMBIENTE_LEER' },

    // 4. Incidencias
    { label: 'Incidencias', path: '/incidencia/incidencias', permiso: 'INCIDENCIA_LEER' },
    { label: 'Estado Dispositivo', path: '/incidencia/estado-dispositivo', permiso: 'ESTADODISPOSITIVO_LEER' },
    { label: 'Resoluciones', path: '/incidencia/resoluciones', permiso: 'RESOLUCION_LEER' },

    // 5. Usuarios
    { label: 'Usuarios', path: '/usuarios', permiso: 'USUARIO_LEER' },
    { label: 'Permisos', path: '/usuarios/permisos', permiso: 'PERMISO_LEER' },
    { label: 'Asignación de Permisos', path: '/usuarios/asignacion', permiso: 'PERMISOS_ASIGNAR' },

    // 6. Auditoría
    { label: 'Auditoría', path: '/auditoria', permiso: 'AUDITORIA_VER' },

    // 7. Reportes 
    { label: 'Reportes', path: '/reportes', permiso: 'CONSUMO_LEER' },

    // 8. Configuración 
    { label: 'Configuración', path: '/configuracion', permiso: 'USUARIO_LEER' },
];

// Nombre del Permiso Admin
const ADMIN_PERM_NAME = 'USUARIO_ADMIN';

// Íconos por módulo (Mantener iconos fuera del componente para mejor rendimiento)
const IconoDashboard = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);
const IconoUsuario = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const IconoRecorridos = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.727A8 8 0 016.343 4.273L17.657 16.727zm0 0A8 8 0 0110.828 20.31L17.657 16.727zM6.343 4.273a8 8 0 0110.828 0M6.343 4.273L4.605 2.535l-1.414 1.414 1.738 1.738z" /></svg>
);
const IconoIncidencia = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
);
const IconoInfraestructura = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
);
const IconoAuditoria = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l3-3m0 0l3 3m-3-3v12" /></svg>
);
const IconoReporte = IconoAuditoria; // Usar el mismo ícono para Reporte
const IconoConfig = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.82 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.82 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.82-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.82-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);


// Agrupación por secciones y ORDENADAS (Dashboard ELIMINADO de las secciones)
const secciones = {
    'Infraestructura': [
        // Orden solicitado: Categorías, Marcas, Proveedores, Sitios, Contratos, Modelos, Ubicaciones, Dispositivos, Otros Dispositivos
        '/infraestructura/categorias',
        '/infraestructura/marcas',
        '/infraestructura/proveedores',
        '/infraestructura/sitios',
        '/infraestructura/contratos',
        '/infraestructura/modelos',
        '/infraestructura/ubicaciones',
        '/infraestructura/dispositivos',
        '/infraestructura/otros-dispositivos',
    ],
    'Recorridos': ['/recorridos/consumibles', '/recorridos/consumos', '/recorridos/parametros'],
    'Incidencias': ['/incidencia/incidencias', '/incidencia/estado-dispositivo', '/incidencia/resoluciones'],
    'Usuarios': ['/usuarios', '/usuarios/permisos', '/usuarios/asignacion'],
    'Auditoría': ['/auditoria'],
    'Reportes': ['/reportes'],
    'Configuración': ['/configuracion'],
};

// Mapeo de íconos por ruta
const iconMap = {
    '/home': IconoDashboard,
    '/usuarios': IconoUsuario,
    '/usuarios/permisos': IconoUsuario,
    '/usuarios/asignacion': IconoUsuario,
    '/recorridos/consumibles': IconoRecorridos,
    '/recorridos/consumos': IconoRecorridos,
    '/recorridos/parametros': IconoRecorridos,
    '/incidencia/incidencias': IconoIncidencia,
    '/incidencia/estado-dispositivo': IconoIncidencia,
    '/incidencia/resoluciones': IconoIncidencia,
    '/infraestructura/contratos': IconoInfraestructura,
    '/infraestructura/dispositivos': IconoInfraestructura,
    '/infraestructura/otros-dispositivos': IconoInfraestructura,
    '/infraestructura/sitios': IconoInfraestructura,
    '/infraestructura/ubicaciones': IconoInfraestructura,
    '/infraestructura/marcas': IconoInfraestructura,
    '/infraestructura/modelos': IconoInfraestructura,
    '/infraestructura/proveedores': IconoInfraestructura,
    '/infraestructura/categorias': IconoInfraestructura,
    '/auditoria': IconoAuditoria,
    '/reportes': IconoReporte,
    '/configuracion': IconoConfig,
};

// Función auxiliar para obtener la sección padre de una ruta
const findParentSection = (path, sections) => {
    for (const [sectionName, paths] of Object.entries(sections)) {
        if (paths.includes(path)) {
            return sectionName;
        }
    }
    return null;
};


const Sidebar = ({ isMenuOpen, handleMenuClose, activePath, usuario }) => {

    // Inicializar el estado abierto con la sección de la ruta activa 
    const [seccionAbierta, setSeccionAbierta] = useState(() =>
        findParentSection(activePath, secciones)
    );

    // Función para manejar el despliegue
    const toggleSeccion = (seccion) => {
        setSeccionAbierta(seccionAbierta === seccion ? null : seccion);
    };

    // Lógica de Filtrado Central 
    const menuFiltrado = useMemo(() => {
        const userPermissions = usuario?.permisos || [];
        const isAdmin = userPermissions.includes(ADMIN_PERM_NAME);

        if (isAdmin) {
            return menuConfig;
        }

        // Filtra los elementos de menuConfig basándose en los permisos del usuario
        return menuConfig.filter(item => userPermissions.includes(item.permiso));

    }, [usuario]);

    // Extraer el item del Dashboard (asumiendo que es el primero y tiene el path '/home')
    const dashboardItem = menuFiltrado.find(item => item.path === '/home');

    // Filtramos los items que pertenecen a las secciones colapsables
    const menuSecciones = menuFiltrado.filter(item => findParentSection(item.path, secciones));


    return (
        <aside className={`
          fixed top-0 left-0 h-screen w-64 bg-blue-900 text-white z-30 
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${isMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
    `}>

            <div className="h-16 flex items-center justify-center border-b border-gray-800 bg-white shadow-md">
                {/* Se usa directamente el tag <img> con LogoImage */}
                <img
                    src={LogoImage}
                    alt="Logo Gestor de Recorridos"
                    className="h-16 w-auto object-contain"
                />
            </div>

            <nav className="mt-6 px-4 overflow-y-auto" style={{ height: 'calc(100vh - 4rem)' }}>

                {/* DASHBOARD - ENLACE DE PRIMER NIVEL (si el usuario tiene permiso) */}
                {dashboardItem && (
                    <NavLink
                        key={dashboardItem.path}
                        to={dashboardItem.path}
                        className={({ isActive }) =>
                            `flex items-center p-3 mb-2 rounded-lg transition duration-200 text-sm font-medium 
                            ${dashboardItem.path === activePath || isActive
                                ? 'bg-red-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}
                        onClick={handleMenuClose}
                    >
                        <IconoDashboard className="h-5 w-5 mr-3" />
                        {dashboardItem.label}
                    </NavLink>
                )}

                {/* SECCIONES COLAPSABLES */}
                {Object.entries(secciones).map(([seccion, rutas]) => {

                    // Solo consideramos los items que el usuario tiene permiso de ver
                    const items = menuSecciones.filter(item => rutas.includes(item.path));
                    if (items.length === 0) return null;

                    const isOpen = seccionAbierta === seccion;

                    // Asignamos el icono según el mapeo de la primera ruta del grupo
                    const HeaderIcon = iconMap[rutas[0]] || IconoDashboard;

                    return (
                        <div key={seccion} className="mb-2">
                            {/* ENCABEZADO CLICKABLE */}
                            <button
                                onClick={() => toggleSeccion(seccion)}
                                className={`w-full flex items-center p-3 rounded-lg transition duration-200 justify-between 
                                    ${isOpen
                                        ? 'bg-gray-700 text-white-400 font-semibold'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <HeaderIcon className="h-5 w-5 mr-3" />
                                    <span className="text-sm font-medium">{seccion}</span>
                                </div>
                                {/* Icono de flecha para indicar despliegue */}
                                <svg
                                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'transform rotate-90' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* SUBMENÚ DESPLEGABLE */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                            >
                                {items.map(item => {
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `flex items-center pl-8 pr-3 py-2 text-sm rounded-lg transition duration-200 
                                                ${item.path === activePath || isActive
                                                    ? 'bg-red-600 text-white font-semibold'
                                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                }`}
                                            onClick={handleMenuClose}
                                        >
                                            {item.label}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;