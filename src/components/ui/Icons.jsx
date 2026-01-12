
// Dashboard
export const IconoDashboard = ({ className = "h-5 w-5", ...props }) => (
    <svg {...props} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7m-9 2v7m4-7v7m5-7l2 2m-2-2l-7-7-7 7" />
    </svg>
);

// Usuarios
export const IconoUsuario = ({ className = "h-5 w-5", ...props }) => (
    <svg {...props} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

// Infraestructura
export const IconoInfraestructura = ({ className = "h-5 w-5", ...props }) => (
    <svg {...props} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

// Recorridos
export const IconoRecorridos = ({ className = "h-5 w-5", ...props }) => (
    <svg {...props} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.727A8 8 0 016.343 4.273L17.657 16.727zm0 0A8 8 0 0110.828 20.31L17.657 16.727zM6.343 4.273a8 8 0 0110.828 0M6.343 4.273L4.605 2.535l-1.414 1.414 1.738 1.738z" />
    </svg>
);

// Incidencias
export const IconoIncidencia = ({ className = "h-5 w-5", ...props }) => (
    <svg {...props} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

// Auditoría
export const IconoAuditoria = ({ className = "h-5 w-5", ...props }) => (
    <svg {...props} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19V6l3-3m0 0l3 3m-3-3v12" />
    </svg>
);

// Reportes
export const IconoReporte = ({ className = "h-5 w-5", ...props }) => (
    <svg {...props} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 12h8m0 0v6m0-6h8" />
    </svg>
);

// Configuración
export const IconoConfig = ({ className = "h-5 w-5", ...props }) => (
    <svg {...props} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.82 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.82 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.82-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.82-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


// Mapeo centralizado de íconos por ruta
export const iconMap = {
    '/home': IconoDashboard,

    // Usuarios
    '/usuarios': IconoUsuario,
    '/usuarios/permisos': IconoUsuario,
    '/usuarios/asignacion': IconoUsuario,

    // Infraestructura
    '/infraestructura/categorias': IconoInfraestructura,
    '/infraestructura/marcas': IconoInfraestructura,
    '/infraestructura/tipos': IconoInfraestructura,
    '/infraestructura/proveedores': IconoInfraestructura,
    '/infraestructura/sitios': IconoInfraestructura,
    '/infraestructura/contratos': IconoInfraestructura,
    '/infraestructura/modelos': IconoInfraestructura,
    '/infraestructura/ubicaciones': IconoInfraestructura,
    '/infraestructura/dispositivos': IconoInfraestructura,
    '/infraestructura/otrosdispositivo': IconoInfraestructura,

    // Recorridos
    '/recorridos/consumibles': IconoRecorridos,
    '/recorridos/consumos': IconoRecorridos,
    '/recorridos/parametros': IconoRecorridos,

    // Incidencias
    '/incidencia/incidencias': IconoIncidencia,
    '/incidencia/resoluciones': IconoIncidencia,
    '/incidencia/estadodispositivo': IconoIncidencia,

    // Auditoría
    '/auditoria': IconoAuditoria,

    // Reportes
    '/reportes/reporte-consumo': IconoReporte,
    '/reportes/vencimiento-contratos': IconoReporte,

};

