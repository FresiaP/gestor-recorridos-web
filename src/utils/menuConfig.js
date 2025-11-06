// src/utils/menuConfig.js

export const menuConfig = [
    // --- SECCIÓN USUARIOS ---
    {
        label: 'Usuarios',
        path: '/usuarios',
        permiso: 'USUARIO_LEER',
    },
    {
        label: 'Permisos', // Se muestra bajo el encabezado "Usuarios"
        path: '/usuarios/permisos',
        permiso: 'PERMISO_LEER',
    },
    {
        label: 'Asignación de Permisos', // Se muestra bajo el encabezado "Usuarios"
        path: '/usuarios/asignacion',
        permiso: 'PERMISOS_ASIGNAR',
    },

    // --- SECCIÓN RECORRIDOS (SIMPLIFICADA) ---
    {
        label: 'Consumibles', // Antes: Recorridos - Consumibles
        path: '/recorridos/consumibles',
        permiso: 'CONSUMIBLE_LEER',
    },
    {
        label: 'Consumos', // Antes: Recorridos - Consumos
        path: '/recorridos/consumos',
        permiso: 'CONSUMO_LEER',
    },
    {
        label: 'Parámetros de Ambiente', // Antes: Recorridos - Parámetros de Ambiente
        path: '/recorridos/parametros',
        permiso: 'PARAMETROAMBIENTE_LEER',
    },

    // --- SECCIÓN INFRAESTRUCTURA (SIMPLIFICADA) ---
    {
        label: 'Contratos', // Antes: Infraestructura - Contratos
        path: '/infraestructura/contratos',
        permiso: 'CONTRATO_LEER',
    },
    {
        label: 'Dispositivos', // Antes: Infraestructura - Dispositivos
        path: '/infraestructura/dispositivos',
        permiso: 'DISPOSITIVO_LEER',
    },
    {
        label: 'Otros Dispositivos', // Antes: Infraestructura - Otros Dispositivos
        path: '/infraestructura/otros-dispositivos',
        permiso: 'OTROSDISPOSITIVO_LEER',
    },
    {
        label: 'Sitios', // Antes: Infraestructura - Sitios
        path: '/infraestructura/sitios',
        permiso: 'SITIO_LEER',
    },
    {
        label: 'Ubicaciones', // Antes: Infraestructura - Ubicaciones
        path: '/infraestructura/ubicaciones',
        permiso: 'UBICACION_LEER',
    },
    {
        label: 'Marcas', // Antes: Infraestructura - Marcas
        path: '/infraestructura/marcas',
        permiso: 'MARCA_LEER',
    },
    {
        label: 'Modelos', // Antes: Infraestructura - Modelos
        path: '/infraestructura/modelos',
        permiso: 'MODELO_LEER',
    },
    {
        label: 'Proveedores', // Antes: Infraestructura - Proveedores
        path: '/infraestructura/proveedores',
        permiso: 'PROVEEDOR_LEER',
    },
    {
        label: 'Categorías', // Antes: Infraestructura - Categorías
        path: '/infraestructura/categorias',
        permiso: 'CATEGORIA_LEER',
    },

    // --- SECCIÓN INCIDENCIAS (SIMPLIFICADA) ---
    {
        label: 'Incidencias', // Se mantiene el nombre específico para este módulo
        path: '/incidencia/incidencias',
        permiso: 'INCIDENCIA_LEER',
    },
    {
        label: 'Estado Dispositivo', // Antes: Incidencias - Estado Dispositivo
        path: '/incidencia/estado-dispositivo',
        permiso: 'ESTADODISPOSITIVO_LEER',
    },
    {
        label: 'Resoluciones', // Antes: Incidencias - Resoluciones
        path: '/incidencia/resoluciones',
        permiso: 'RESOLUCION_LEER',
    },

    // --- OTROS MÓDULOS ---
    {
        label: 'Auditoría',
        path: '/auditoria',
        permiso: 'AUDITORIA_VER',
    },
    {
        label: 'Configuración',
        path: '/configuracion',
        permiso: 'USUARIO_ADMIN',
    },
    {
        label: 'Reportes',
        path: '/reportes',
        permiso: 'USUARIO_LEER', // o un permiso específico como 'REPORTES_VER' si lo defines
    },
];